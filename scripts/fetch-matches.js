/**
 * fetch-matches.js — Obtiene partidos y resultados del Mundial 2026
 * 
 * Combina múltiples fuentes:
 * 1. football-data.org API (datos estructurados de partidos)
 * 2. ESPN API pública (scores en tiempo real)
 * 3. Caché de noticias (para enriquecer contexto)
 * 
 * Guarda los datos en matches-cache.json para use en generate-daily-content.js
 */

const fs = require('fs');
const https = require('https');

const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY || '';
const COMPETITION_ID = process.env.COMPETITION_ID || '2000';

// ─── HTTP helper ──────────────────────────────────────────────────────────────
function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = new URL(url);
    const reqOptions = {
      hostname: options.hostname,
      path: options.pathname + options.search,
      headers: {
        'User-Agent': 'Mundial2026Bot/1.0',
        ...headers
      },
      timeout: 15000
    };
    https.get(reqOptions, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpGet(res.headers.location, headers).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({ raw: data.substring(0, 500) }); }
      });
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('Timeout')); });
  });
}

// ─── 1. football-data.org — Partidos de hoy y ayer ──────────────────────────
async function getMatchesFromFootballData() {
  if (!FOOTBALL_API_KEY) {
    console.log('  ⚠️ FOOTBALL_DATA_API_KEY no configurada — usando solo ESPN');
    return { recientes: [], proximos: [], standings: [] };
  }
  
  try {
    const hoy = new Date();
    const ayer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000);
    const manana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000);
    const en3dias = new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    const fmt = d => d.toISOString().split('T')[0];
    
    // Partidos recientes (últimas 48h)
    const [recentData, upcomingData, standingsData] = await Promise.allSettled([
      httpGet(
        `https://api.football-data.org/v4/competitions/${COMPETITION_ID}/matches?dateFrom=${fmt(ayer)}&dateTo=${fmt(hoy)}&status=FINISHED`,
        { 'X-Auth-Token': FOOTBALL_API_KEY }
      ),
      httpGet(
        `https://api.football-data.org/v4/competitions/${COMPETITION_ID}/matches?dateFrom=${fmt(hoy)}&dateTo=${fmt(en3dias)}&status=SCHEDULED`,
        { 'X-Auth-Token': FOOTBALL_API_KEY }
      ),
      httpGet(
        `https://api.football-data.org/v4/competitions/${COMPETITION_ID}/standings`,
        { 'X-Auth-Token': FOOTBALL_API_KEY }
      )
    ]);
    
    const recientes = (recentData.status === 'fulfilled' ? recentData.value.matches || [] : [])
      .map(m => ({
        id: m.id,
        estado: 'finalizado',
        equipo1: m.homeTeam?.name || 'Local',
        equipo2: m.awayTeam?.name || 'Visitante',
        golesLocal: m.score?.fullTime?.home,
        golesVisita: m.score?.fullTime?.away,
        fase: m.stage || m.group || 'Fase de grupos',
        fecha: m.utcDate,
        fuente: 'football-data.org'
      }));
    
    const proximos = (upcomingData.status === 'fulfilled' ? upcomingData.value.matches || [] : [])
      .map(m => ({
        id: m.id,
        estado: 'programado',
        equipo1: m.homeTeam?.name || 'Local',
        equipo2: m.awayTeam?.name || 'Visitante',
        fase: m.stage || m.group || 'Fase de grupos',
        fecha: m.utcDate,
        fuente: 'football-data.org'
      }));
    
    const standings = standingsData.status === 'fulfilled' 
      ? (standingsData.value.standings || []).slice(0, 8)
      : [];
    
    return { recientes, proximos, standings };
  } catch (err) {
    console.error('  ⚠️ Error football-data.org:', err.message);
    return { recientes: [], proximos: [], standings: [] };
  }
}

// ─── 2. ESPN API pública — Scores en tiempo real ─────────────────────────────
async function getMatchesFromESPN() {
  try {
    // ESPN tiene una API pública no oficial para scores
    const data = await httpGet('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard');
    
    const events = data.events || [];
    const partidos = events.map(e => {
      const comp = e.competitions?.[0];
      const teams = comp?.competitors || [];
      const home = teams.find(t => t.homeAway === 'home') || teams[0] || {};
      const away = teams.find(t => t.homeAway === 'away') || teams[1] || {};
      const status = e.status?.type;
      
      return {
        id: `espn-${e.id}`,
        estado: status?.completed ? 'finalizado' : (status?.description === 'In Progress' ? 'en_curso' : 'programado'),
        equipo1: home.team?.displayName || home.team?.name || 'Local',
        equipo2: away.team?.displayName || away.team?.name || 'Visitante',
        golesLocal: status?.completed ? parseInt(home.score || '0') : null,
        golesVisita: status?.completed ? parseInt(away.score || '0') : null,
        golesLocalEnVivo: !status?.completed ? parseInt(home.score || '0') : null,
        golesVisitaEnVivo: !status?.completed ? parseInt(away.score || '0') : null,
        minuto: status?.displayClock || null,
        fase: e.season?.type?.name || 'Mundial 2026',
        fecha: e.date,
        enCurso: status?.description === 'In Progress',
        fuente: 'ESPN'
      };
    });
    
    const recientes = partidos.filter(p => p.estado === 'finalizado');
    const enCurso = partidos.filter(p => p.enCurso);
    const proximos = partidos.filter(p => p.estado === 'programado');
    
    return { recientes, enCurso, proximos };
  } catch (err) {
    console.error('  ⚠️ Error ESPN:', err.message);
    return { recientes: [], enCurso: [], proximos: [] };
  }
}

// ─── Pipeline principal ───────────────────────────────────────────────────────
async function fetchMatches() {
  console.log('⚽ Obteniendo partidos y resultados del Mundial 2026...\n');
  
  const [footballData, espnData] = await Promise.allSettled([
    getMatchesFromFootballData(),
    getMatchesFromESPN()
  ]);
  
  const fd = footballData.status === 'fulfilled' ? footballData.value : { recientes: [], proximos: [], standings: [] };
  const espn = espnData.status === 'fulfilled' ? espnData.value : { recientes: [], enCurso: [], proximos: [] };
  
  // Deduplicar combinando ambas fuentes
  const idsVistos = new Set();
  
  const combinar = (...arrays) => arrays.flat().filter(p => {
    const key = `${p.equipo1}-${p.equipo2}-${(p.fecha || '').substring(0, 10)}`;
    if (idsVistos.has(key)) return false;
    idsVistos.add(key);
    return true;
  });
  
  const cache = {
    fecha: new Date().toISOString(),
    partidos_recientes: combinar(fd.recientes, espn.recientes),
    partidos_en_curso: espn.enCurso || [],
    partidos_proximos: combinar(fd.proximos, espn.proximos),
    tabla_posiciones: fd.standings,
    resumen: {
      total_recientes: 0,
      total_en_curso: 0,
      total_proximos: 0
    }
  };
  
  cache.resumen.total_recientes = cache.partidos_recientes.length;
  cache.resumen.total_en_curso = cache.partidos_en_curso.length;
  cache.resumen.total_proximos = cache.partidos_proximos.length;
  
  fs.writeFileSync('matches-cache.json', JSON.stringify(cache, null, 2));
  
  console.log('📊 Resumen de partidos obtenidos:');
  console.log(`  ✅ Finalizados recientes: ${cache.resumen.total_recientes}`);
  console.log(`  🔴 En curso ahora: ${cache.resumen.total_en_curso}`);
  console.log(`  📅 Próximos: ${cache.resumen.total_proximos}`);
  
  if (cache.partidos_en_curso.length > 0) {
    console.log('\n🔴 PARTIDOS EN VIVO AHORA:');
    cache.partidos_en_curso.forEach(p => {
      console.log(`  ⚽ ${p.equipo1} ${p.golesLocalEnVivo ?? 0}-${p.golesVisitaEnVivo ?? 0} ${p.equipo2} (min ${p.minuto})`);
    });
  }
  
  if (cache.partidos_recientes.length > 0) {
    console.log('\n📋 Resultados recientes:');
    cache.partidos_recientes.slice(0, 5).forEach(p => {
      console.log(`  ⚽ ${p.equipo1} ${p.golesLocal}-${p.golesVisita} ${p.equipo2}`);
    });
  }
}

fetchMatches().catch(err => {
  console.error('❌ Error en fetch-matches:', err.message);
  // No falla el pipeline
  fs.writeFileSync('matches-cache.json', JSON.stringify({
    fecha: new Date().toISOString(),
    partidos_recientes: [],
    partidos_en_curso: [],
    partidos_proximos: [],
    tabla_posiciones: [],
    resumen: { total_recientes: 0, total_en_curso: 0, total_proximos: 0 },
    error: err.message
  }, null, 2));
  process.exit(0);
});
