/**
 * fetch-matches.js — FOOTBALL AI STUDIO v4.0
 *
 * ANTES (v3): solo Mundial 2026 (COMPETITION_ID=2000).
 * AHORA (v4): TODAS las competiciones del plan gratis de football-data.org
 * en UNA SOLA llamada (/v4/matches?competitions=...) → respeta el límite
 * de 10 llamadas/minuto y cubre Champions, Premier, LaLiga, Serie A,
 * Bundesliga, Ligue 1, Libertadores, Brasileirão y torneos FIFA activos.
 *
 * + ESPN scoreboard multi-liga para partidos en vivo.
 * + Tabla de posiciones: 1 competición por día (rotación semanal).
 *
 * NOTA: la Primera División de Chile no está en football-data.org gratis.
 * El fútbol chileno se cubre vía fetch-news.js (funciona muy bien con RSS).
 *
 * Salida: matches-cache.json — MISMO formato que v3 (compatible con todo
 * el pipeline existente) + campo `competencia` en cada partido.
 */

const fs = require('fs');
const https = require('https');
const { COMPETICIONES_API, ROTACION_TABLA } = require('../config/ligas');

const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY || '';
// Permite override por secret; por defecto usa todas las de config/ligas.js
const COMPETITIONS = (process.env.COMPETITIONS || Object.keys(COMPETICIONES_API).join(',')).trim();

// ─── HTTP helper ─────────────────────────────────────────────────────────────
function httpGet(url, headers = {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 4) return reject(new Error('Demasiadas redirecciones'));
    const u = new URL(url);
    const req = https.get({
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { 'User-Agent': 'FootballAIStudio/4.0', ...headers },
      timeout: 15000,
    }, (res) => {
      if ([301, 302].includes(res.statusCode)) {
        return httpGet(res.headers.location, headers, redirects + 1).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({ raw: data.substring(0, 500) }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', function () { this.destroy(); reject(new Error('Timeout')); });
  });
}

function nombreCompetencia(m) {
  const id = m.competition?.id;
  return COMPETICIONES_API[id]?.nombre || m.competition?.name || 'Fútbol Internacional';
}

// ─── 1. football-data.org — TODAS las competiciones en 2 llamadas ────────────
async function getMatchesFromFootballData() {
  if (!FOOTBALL_API_KEY) {
    console.log('  ⚠️ FOOTBALL_DATA_API_KEY no configurada — usando solo ESPN');
    return { recientes: [], proximos: [], standings: [], tablaCompetencia: null };
  }
  try {
    const hoy = new Date();
    const ayer = new Date(hoy.getTime() - 48 * 60 * 60 * 1000);
    const en3dias = new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000);
    const fmt = (d) => d.toISOString().split('T')[0];
    const auth = { 'X-Auth-Token': FOOTBALL_API_KEY };

    // Tabla del día: rota 1 competición por día de la semana
    const compTablaHoy = ROTACION_TABLA[hoy.getDay()] || 2021;

    const [recentData, upcomingData, standingsData] = await Promise.allSettled([
      httpGet(`https://api.football-data.org/v4/matches?competitions=${COMPETITIONS}&dateFrom=${fmt(ayer)}&dateTo=${fmt(hoy)}&status=FINISHED`, auth),
      httpGet(`https://api.football-data.org/v4/matches?competitions=${COMPETITIONS}&dateFrom=${fmt(hoy)}&dateTo=${fmt(en3dias)}&status=SCHEDULED`, auth),
      httpGet(`https://api.football-data.org/v4/competitions/${compTablaHoy}/standings`, auth),
    ]);

    const mapear = (m, estado) => ({
      id: m.id,
      estado,
      equipo1: m.homeTeam?.shortName || m.homeTeam?.name || 'Local',
      equipo2: m.awayTeam?.shortName || m.awayTeam?.name || 'Visitante',
      ...(estado === 'finalizado' && {
        golesLocal: m.score?.fullTime?.home,
        golesVisita: m.score?.fullTime?.away,
      }),
      competencia: nombreCompetencia(m),
      prioridad: COMPETICIONES_API[m.competition?.id]?.prioridad || 5,
      hashtag: COMPETICIONES_API[m.competition?.id]?.hashtag || '#Futbol',
      fase: m.stage || m.group || 'Temporada regular',
      fecha: m.utcDate,
      fuente: 'football-data.org',
    });

    const recientes = (recentData.status === 'fulfilled' ? recentData.value.matches || [] : [])
      .map((m) => mapear(m, 'finalizado'))
      .sort((a, b) => b.prioridad - a.prioridad); // Champions/Libertadores primero

    const proximos = (upcomingData.status === 'fulfilled' ? upcomingData.value.matches || [] : [])
      .map((m) => mapear(m, 'programado'))
      .sort((a, b) => b.prioridad - a.prioridad);

    const standings = standingsData.status === 'fulfilled'
      ? (standingsData.value.standings || []).slice(0, 2)
      : [];

    return {
      recientes,
      proximos,
      standings,
      tablaCompetencia: COMPETICIONES_API[compTablaHoy]?.nombre || null,
    };
  } catch (err) {
    console.error('  ⚠️ Error football-data.org:', err.message);
    return { recientes: [], proximos: [], standings: [], tablaCompetencia: null };
  }
}

// ─── 2. ESPN API pública — Scores en vivo multi-liga ─────────────────────────
const ESPN_LIGAS = [
  { slug: 'uefa.champions', nombre: 'Champions League' },
  { slug: 'eng.1', nombre: 'Premier League' },
  { slug: 'esp.1', nombre: 'LaLiga' },
  { slug: 'conmebol.libertadores', nombre: 'Copa Libertadores' },
  { slug: 'chi.1', nombre: 'Primera División de Chile' }, // ⭐ ESPN SÍ tiene la liga chilena
  { slug: 'chi.copa_chi', nombre: 'Copa Chile' },
  { slug: 'fifa.world', nombre: 'Mundial FIFA' },
];

async function getMatchesFromESPN() {
  const recientes = [], enCurso = [], proximos = [];
  for (const liga of ESPN_LIGAS) {
    try {
      const data = await httpGet(`https://site.api.espn.com/apis/site/v2/sports/soccer/${liga.slug}/scoreboard`);
      for (const e of data.events || []) {
        const comp = e.competitions?.[0];
        const teams = comp?.competitors || [];
        const home = teams.find((t) => t.homeAway === 'home') || teams[0] || {};
        const away = teams.find((t) => t.homeAway === 'away') || teams[1] || {};
        const status = e.status?.type;
        const esChile = liga.slug.startsWith('chi.');
        const p = {
          id: `espn-${e.id}`,
          estado: status?.completed ? 'finalizado' : (status?.description === 'In Progress' ? 'en_curso' : 'programado'),
          equipo1: home.team?.displayName || 'Local',
          equipo2: away.team?.displayName || 'Visitante',
          golesLocal: status?.completed ? parseInt(home.score || '0', 10) : null,
          golesVisita: status?.completed ? parseInt(away.score || '0', 10) : null,
          golesLocalEnVivo: !status?.completed ? parseInt(home.score || '0', 10) : null,
          golesVisitaEnVivo: !status?.completed ? parseInt(away.score || '0', 10) : null,
          minuto: status?.displayClock || null,
          competencia: liga.nombre,
          prioridad: esChile ? 12 : 8, // ⭐ Chile por encima de todo
          hashtag: esChile ? '#FutbolChileno' : '#Futbol',
          fase: liga.nombre,
          fecha: e.date,
          enCurso: status?.description === 'In Progress',
          fuente: 'ESPN',
        };
        if (p.enCurso) enCurso.push(p);
        else if (p.estado === 'finalizado') recientes.push(p);
        else proximos.push(p);
      }
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`  ⚠️ ESPN ${liga.nombre}: ${err.message}`);
    }
  }
  return { recientes, enCurso, proximos };
}

// ─── Pipeline principal ──────────────────────────────────────────────────────
async function fetchMatches() {
  console.log('⚽ FOOTBALL AI STUDIO v4.0 — Partidos: Chile + ligas del mundo...\n');

  const [footballData, espnData] = await Promise.allSettled([
    getMatchesFromFootballData(),
    getMatchesFromESPN(),
  ]);

  const fd = footballData.status === 'fulfilled' ? footballData.value : { recientes: [], proximos: [], standings: [], tablaCompetencia: null };
  const espn = espnData.status === 'fulfilled' ? espnData.value : { recientes: [], enCurso: [], proximos: [] };

  const idsVistos = new Set();
  const combinar = (...arrays) => arrays.flat()
    .filter((p) => {
      const key = `${p.equipo1}-${p.equipo2}-${(p.fecha || '').substring(0, 10)}`;
      if (idsVistos.has(key)) return false;
      idsVistos.add(key);
      return true;
    })
    .sort((a, b) => (b.prioridad || 5) - (a.prioridad || 5));

  const cache = {
    fecha: new Date().toISOString(),
    partidos_recientes: combinar(espn.recientes, fd.recientes).slice(0, 20),
    partidos_en_curso: espn.enCurso || [],
    partidos_proximos: combinar(espn.proximos, fd.proximos).slice(0, 20),
    tabla_posiciones: fd.standings,
    tabla_competencia: fd.tablaCompetencia,
    resumen: {},
  };
  cache.resumen = {
    total_recientes: cache.partidos_recientes.length,
    total_en_curso: cache.partidos_en_curso.length,
    total_proximos: cache.partidos_proximos.length,
  };

  fs.writeFileSync('matches-cache.json', JSON.stringify(cache, null, 2));

  console.log('📊 Resumen de partidos:');
  console.log(`  ✅ Finalizados recientes: ${cache.resumen.total_recientes}`);
  console.log(`  🔴 En curso ahora: ${cache.resumen.total_en_curso}`);
  console.log(`  📅 Próximos: ${cache.resumen.total_proximos}`);
  if (fd.tablaCompetencia) console.log(`  📋 Tabla del día: ${fd.tablaCompetencia}`);

  cache.partidos_en_curso.forEach((p) => {
    console.log(`  🔴 [${p.competencia}] ${p.equipo1} ${p.golesLocalEnVivo ?? 0}-${p.golesVisitaEnVivo ?? 0} ${p.equipo2} (${p.minuto})`);
  });
  cache.partidos_recientes.slice(0, 6).forEach((p) => {
    console.log(`  ⚽ [${p.competencia}] ${p.equipo1} ${p.golesLocal}-${p.golesVisita} ${p.equipo2}`);
  });
}

fetchMatches().catch((err) => {
  console.error('❌ Error en fetch-matches:', err.message);
  fs.writeFileSync('matches-cache.json', JSON.stringify({
    fecha: new Date().toISOString(),
    partidos_recientes: [], partidos_en_curso: [], partidos_proximos: [],
    tabla_posiciones: [], resumen: { total_recientes: 0, total_en_curso: 0, total_proximos: 0 },
    error: err.message,
  }, null, 2));
  process.exit(0);
});
