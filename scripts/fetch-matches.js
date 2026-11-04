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
// Resultados y programación: ESPN scoreboard. No se consulta football-data.org.

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

// ─── ESPN API pública — Scores en vivo multi-liga ─────────────────────────
const ESPN_LIGAS = [
  { slug: 'chi.1', nombre: 'Primera División de Chile' },
  { slug: 'chi.2', nombre: 'Liga de Ascenso de Chile' },
  { slug: 'chi.copa_chi', nombre: 'Copa Chile' },
  { slug: 'conmebol.libertadores', nombre: 'Copa Libertadores' },
  { slug: 'conmebol.sudamericana', nombre: 'Copa Sudamericana' },
  { slug: 'uefa.champions', nombre: 'Champions League' },
  { slug: 'uefa.europa', nombre: 'Europa League' },
  { slug: 'eng.1', nombre: 'Premier League' },
  { slug: 'esp.1', nombre: 'LaLiga' },
  { slug: 'ita.1', nombre: 'Serie A' },
  { slug: 'ger.1', nombre: 'Bundesliga' },
  { slug: 'fra.1', nombre: 'Ligue 1' },
  { slug: 'arg.1', nombre: 'Liga Profesional Argentina' },
  { slug: 'bra.1', nombre: 'Brasileirão' },
  { slug: 'usa.1', nombre: 'MLS' },
  { slug: 'mex.1', nombre: 'Liga MX' },
  { slug: 'por.1', nombre: 'Primeira Liga' },
  { slug: 'fifa.world', nombre: 'Mundial FIFA' },
];

async function getMatchesFromESPN() {
  const recientes = [], enCurso = [], proximos = [];
  const today = new Date();
  const start = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  const end = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const ymd = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}`;
  const dateRange = `${ymd(start)}-${ymd(end)}`;
  for (const liga of ESPN_LIGAS) {
    try {
      const data = await httpGet(`https://site.api.espn.com/apis/site/v2/sports/soccer/${liga.slug}/scoreboard?dates=${dateRange}`);
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
          escudoLocal: home.team?.logo || null,
          escudoVisita: away.team?.logo || null,
          estadio: comp?.venue?.fullName || e.venue?.fullName || null,
          espnEventId: e.id,
          espnLeagueSlug: liga.slug,
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
          url: `https://www.espn.com/soccer/match/_/gameId/${e.id}`,
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
  console.log('⚽ CHILENSIS FÚTBOL — Resultados ESPN: Chile + ligas internacionales...\n');
  const espn = await getMatchesFromESPN();

  const idsVistos = new Set();
  const combinar = (...arrays) => arrays.flat()
    .filter((p) => {
      const key = `${p.equipo1}-${p.equipo2}-${(p.fecha || '').substring(0, 10)}`;
      if (idsVistos.has(key)) return false;
      idsVistos.add(key);
      return true;
    })
    .sort((a, b) => (b.prioridad || 5) - (a.prioridad || 5));

  const partidosRecientes = combinar(espn.recientes).slice(0, 60);
  // Enriquecer los partidos recientes de ESPN con goleadores/minutos cuando el resumen los exponga.
  // Si la fuente no publica esos detalles, se dejan ausentes y el guion lo indica expresamente.
  for (const partido of partidosRecientes.filter(p => p.espnEventId && p.espnLeagueSlug).slice(0, 8)) {
    try {
      const summary = await httpGet(`https://site.api.espn.com/apis/site/v2/sports/soccer/${partido.espnLeagueSlug}/summary?event=${partido.espnEventId}`);
      const plays = Array.isArray(summary.scoringPlays) ? summary.scoringPlays : Array.isArray(summary.scoringPlays?.items) ? summary.scoringPlays.items : [];
      const goleadores = plays.map(play => {
        const description = String(play.text || play.type?.text || play.shortText || '');
        const participants = Array.isArray(play.participants) ? play.participants : Array.isArray(play.athletesInvolved) ? play.athletesInvolved : [];
        const athlete = participants.map(p => p.athlete?.displayName || p.displayName || p.name).find(Boolean);
        const goalLike = /goal|gol|penalty|penalti|own goal|autogol/i.test(description) || Boolean(play.type?.id && play.team);
        if (!goalLike || !athlete) return null;
        const minute = play.clock?.displayValue || play.time?.displayValue || play.period?.number && `${play.period.number}T` || '';
        return `${athlete}${minute ? ` (${minute})` : ''}${play.team?.displayName ? ` · ${play.team.displayName}` : ''}`;
      }).filter(Boolean);
      if (goleadores.length) partido.goleadores = [...new Set(goleadores)];
    } catch (err) {
      console.log(`  ℹ️ Goleadores no disponibles para ${partido.equipo1} vs ${partido.equipo2}: ${err.message}`);
    }
  }

  const cache = {
    fecha: new Date().toISOString(),
    partidos_recientes: partidosRecientes,
    partidos_en_curso: espn.enCurso || [],
    partidos_proximos: combinar(espn.proximos).slice(0, 30),
    tabla_posiciones: [],
    tabla_competencia: null,
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
