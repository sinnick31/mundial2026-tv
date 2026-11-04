/**
 * fetch-matches.js — FÚTBOL CHILENSIS
 * ESPN como proveedor principal; TheSportsDB como respaldo verificable
 * para Primera División y Primera B de Chile.
 */

const fs = require('fs');
const https = require('https');

function httpGet(url, headers = {}, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 4) return reject(new Error('Demasiadas redirecciones'));
    const u = new URL(url);
    const req = https.get({
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { 'User-Agent': 'FootballChilensisNewsroom/7.0', Accept: 'application/json', ...headers },
      timeout: 15000,
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const next = new URL(res.headers.location, u).toString();
        return httpGet(next, headers, redirects + 1).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if ((res.statusCode || 500) >= 400) return reject(new Error('HTTP ' + res.statusCode));
        try {
          const parsed = JSON.parse(data);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return reject(new Error('Respuesta JSON con formato inesperado'));
          }
          resolve(parsed);
        } catch (err) {
          reject(new Error('Respuesta no es JSON válido'));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', function () { this.destroy(); reject(new Error('Timeout')); });
  });
}

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

const THESPORTSDB_LIGAS = [
  { id: '4627', nombre: 'Chile Primera Division', competencia: 'Primera División de Chile' },
  { id: '4899', nombre: 'Chile Primera B', competencia: 'Liga de Ascenso de Chile' },
];

function validateEspnLeagueConfig(ligas = ESPN_LIGAS) {
  const seen = new Set();
  const errors = [];
  for (const liga of ligas) {
    if (!liga || typeof liga.slug !== 'string' || !/^[a-z0-9]+(?:\.[a-z0-9_]+)*$/.test(liga.slug)) {
      errors.push({ slug: liga?.slug || null, error: 'slug_format_invalid' });
      continue;
    }
    if (seen.has(liga.slug)) errors.push({ slug: liga.slug, error: 'slug_duplicate' });
    seen.add(liga.slug);
  }
  return { valid: errors.length === 0, total: ligas.length, errors };
}

function ymd(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function getWindow(now) {
  const start = new Date(now.getTime() - 3 * 86400000);
  const end = new Date(now.getTime() + 7 * 86400000);
  return { start, end, startDay: start.toISOString().slice(0, 10), endDay: end.toISOString().slice(0, 10) };
}

function normalizeEspnEvent(event, liga) {
  const comp = event.competitions?.[0];
  const teams = comp?.competitors || [];
  const home = teams.find((team) => team.homeAway === 'home') || teams[0] || {};
  const away = teams.find((team) => team.homeAway === 'away') || teams[1] || {};
  const status = event.status?.type || {};
  if (!event.id || !home.team?.displayName || !away.team?.displayName || !event.date) return null;
  const inProgress = status.description === 'In Progress' || status.state === 'in';
  const completed = Boolean(status.completed);
  const isChile = liga.slug.startsWith('chi.');
  return {
    id: 'espn-' + event.id,
    estado: completed ? 'finalizado' : (inProgress ? 'en_curso' : 'programado'),
    equipo1: home.team.displayName,
    equipo2: away.team.displayName,
    escudoLocal: home.team.logo || null,
    escudoVisita: away.team.logo || null,
    estadio: comp?.venue?.fullName || event.venue?.fullName || null,
    espnEventId: String(event.id),
    espnLeagueSlug: liga.slug,
    golesLocal: completed && Number.isFinite(Number(home.score)) ? Number(home.score) : null,
    golesVisita: completed && Number.isFinite(Number(away.score)) ? Number(away.score) : null,
    golesLocalEnVivo: inProgress && Number.isFinite(Number(home.score)) ? Number(home.score) : null,
    golesVisitaEnVivo: inProgress && Number.isFinite(Number(away.score)) ? Number(away.score) : null,
    minuto: status.displayClock || null,
    competencia: liga.nombre,
    prioridad: 8,
    hashtag: isChile ? '#FutbolChileno' : '#Futbol',
    fase: liga.nombre,
    fecha: event.date,
    enCurso: inProgress,
    fuente: 'ESPN',
    fuente_url: 'https://www.espn.com/soccer/match/_/gameId/' + event.id,
    url: 'https://www.espn.com/soccer/match/_/gameId/' + event.id,
  };
}

async function getMatchesFromESPN(options = {}) {
  const request = options.request || httpGet;
  const sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const now = options.now || new Date();
  const { start, end, startDay, endDay } = getWindow(now);
  const config = validateEspnLeagueConfig();
  if (!config.valid) {
    const error = new Error('Configuración de identificadores ESPN inválida');
    error.diagnostics = { validacion_config: config };
    throw error;
  }

  const recientes = [], enCurso = [], proximos = [], errores = [], ligasValidas = [];
  const probeDate = ymd(now);
  console.log('🔎 ESPN: prevalidando identificadores con fecha individual ' + probeDate);

  // Primero se valida cada identificador con una fecha individual. Un events:[]
  // vacío es una respuesta válida; HTTP 400/404 no lo es.
  for (const liga of ESPN_LIGAS) {
    try {
      const probe = await request(
        'https://site.api.espn.com/apis/site/v2/sports/soccer/' + liga.slug + '/scoreboard?dates=' + probeDate
      );
      if (!Array.isArray(probe.events)) throw new Error('Respuesta sin events[]');
      ligasValidas.push(liga);
    } catch (err) {
      errores.push({ liga: liga.nombre, slug: liga.slug, etapa: 'validacion_id', error: err.message });
      console.error('  ⚠️ Identificador ESPN no validado ' + liga.slug + ': ' + err.message);
    }
    await sleep(150);
  }

  // ESPN rechaza rangos YYYYMMDD-YYYYMMDD en varias respuestas 400.
  // Se consulta por mes (YYYYMM) y se filtra localmente al intervalo editorial.
  const months = [...new Set([start, end].map((date) => date.toISOString().slice(0, 7).replace('-', '')))];
  let consultasCorrectas = 0;
  for (const liga of ligasValidas) {
    for (const month of months) {
      try {
        const data = await request(
          'https://site.api.espn.com/apis/site/v2/sports/soccer/' + liga.slug + '/scoreboard?dates=' + month
        );
        if (!Array.isArray(data.events)) throw new Error('Respuesta sin events[]');
        consultasCorrectas += 1;
        for (const event of data.events) {
          const eventDay = String(event.date || '').slice(0, 10);
          if (eventDay < startDay || eventDay > endDay) continue;
          const match = normalizeEspnEvent(event, liga);
          if (!match) continue;
          if (match.estado === 'en_curso') enCurso.push(match);
          else if (match.estado === 'finalizado') recientes.push(match);
          else proximos.push(match);
        }
      } catch (err) {
        errores.push({ liga: liga.nombre, slug: liga.slug, etapa: 'scoreboard_mes', mes: month, error: err.message });
        console.error('  ⚠️ ESPN ' + liga.nombre + ' (' + month + '): ' + err.message);
      }
      await sleep(150);
    }
  }

  return {
    recientes, enCurso, proximos, errores,
    ligas_consultadas: ESPN_LIGAS.length,
    ligas_validadas: ligasValidas.length,
    consultas_correctas: consultasCorrectas,
    rango: { desde: startDay, hasta: endDay },
    preflight_fecha: probeDate,
  };
}

function normalizeTheSportsDbEvents(events, liga, now = new Date()) {
  if (!Array.isArray(events)) throw new Error('TheSportsDB no devolvió events[]');
  const { startDay, endDay } = getWindow(now);
  const recientes = [], enCurso = [], proximos = [];
  for (const event of events) {
    const date = String(event.dateEvent || '').slice(0, 10);
    const home = String(event.strHomeTeam || '').trim();
    const away = String(event.strAwayTeam || '').trim();
    const eventId = String(event.idEvent || '').trim();
    if (!eventId || !home || !away || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (date < startDay || date > endDay) continue;

    const status = String(event.strStatus || '').toLowerCase();
    const hasScore = event.intHomeScore !== null && event.intHomeScore !== undefined &&
      event.intAwayScore !== null && event.intAwayScore !== undefined &&
      String(event.intHomeScore).trim() !== '' && String(event.intAwayScore).trim() !== '' &&
      Number.isFinite(Number(event.intHomeScore)) && Number.isFinite(Number(event.intAwayScore));
    const live = /in progress|live|1st half|2nd half|half time|extra time/.test(status);
    const finished = /match finished|finished|full time|ft/.test(status);
    const scheduled = /not started|scheduled|upcoming|fixture/.test(status);
    if (live && !hasScore) continue;
    if (finished && !hasScore) continue;
    if (!live && !finished && !scheduled && date <= now.toISOString().slice(0, 10)) continue;

    const match = {
      id: 'thesportsdb-' + eventId,
      estado: finished ? 'finalizado' : (live ? 'en_curso' : 'programado'),
      equipo1: home,
      equipo2: away,
      escudoLocal: event.strHomeTeamBadge || null,
      escudoVisita: event.strAwayTeamBadge || null,
      estadio: event.strVenue || null,
      golesLocal: finished ? Number(event.intHomeScore) : null,
      golesVisita: finished ? Number(event.intAwayScore) : null,
      golesLocalEnVivo: live ? Number(event.intHomeScore) : null,
      golesVisitaEnVivo: live ? Number(event.intAwayScore) : null,
      competencia: event.strLeague || liga.competencia,
      prioridad: 8,
      hashtag: '#FutbolChileno',
      fase: event.strSeason || 'Temporada 2026',
      fecha: date,
      enCurso: live,
      fuente: 'TheSportsDB',
      fuente_url: 'https://www.thesportsdb.com/api/v1/json/123/eventsseason.php?id=' + liga.id + '&s=2026',
      url: 'https://www.thesportsdb.com/event/' + eventId,
      theSportsDbEventId: eventId,
    };
    if (live) enCurso.push(match);
    else if (finished) recientes.push(match);
    else proximos.push(match);
  }
  return { recientes, enCurso, proximos };
}

async function getMatchesFromTheSportsDB(options = {}) {
  const request = options.request || httpGet;
  const sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const now = options.now || new Date();
  const recientes = [], enCurso = [], proximos = [], errores = [];
  let ligasCorrectas = 0;
  for (const liga of THESPORTSDB_LIGAS) {
    const url = 'https://www.thesportsdb.com/api/v1/json/123/eventsseason.php?id=' + liga.id + '&s=2026';
    try {
      const data = await request(url);
      if (!Array.isArray(data.events)) throw new Error('Respuesta sin events[] para temporada 2026');
      ligasCorrectas += 1;
      const normalized = normalizeTheSportsDbEvents(data.events, liga, now);
      recientes.push(...normalized.recientes);
      enCurso.push(...normalized.enCurso);
      proximos.push(...normalized.proximos);
    } catch (err) {
      errores.push({ liga: liga.competencia, id: liga.id, error: err.message });
      console.error('  ⚠️ TheSportsDB ' + liga.competencia + ': ' + err.message);
    }
    await sleep(250);
  }
  return { recientes, enCurso, proximos, errores, ligas_consultadas: THESPORTSDB_LIGAS.length, ligas_correctas: ligasCorrectas };
}

function mergeUnique(...arrays) {
  const seen = new Set();
  return arrays.flat().filter((match) => {
    const teams = [String(match.equipo1 || '').trim().toLocaleLowerCase(), String(match.equipo2 || '').trim().toLocaleLowerCase()].sort();
    const key = teams.join('|') + '|' + String(match.fecha || '').slice(0, 10);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => (b.prioridad || 0) - (a.prioridad || 0));
}

async function fetchMatches(options = {}) {
  console.log('⚽ FÚTBOL CHILENSIS — Resultados y calendario verificables\n');
  const espn = await getMatchesFromESPN(options);
  const espnChileCount = [...espn.recientes, ...espn.enCurso, ...espn.proximos]
    .filter((match) => match.hashtag === '#FutbolChileno').length;

  let backup = { recientes: [], enCurso: [], proximos: [], errores: [], ligas_consultadas: 0, ligas_correctas: 0 };
  if (!espnChileCount) {
    console.log('🇨🇱 ESPN no aportó partidos chilenos. Consultando respaldo TheSportsDB...');
    backup = await getMatchesFromTheSportsDB(options);
  }

  const partidosRecientes = mergeUnique(espn.recientes, backup.recientes).slice(0, 60);
  const partidosEnCurso = mergeUnique(espn.enCurso, backup.enCurso).slice(0, 30);
  const partidosProximos = mergeUnique(espn.proximos, backup.proximos).slice(0, 40);

  for (const partido of partidosRecientes.filter((match) => match.espnEventId && match.espnLeagueSlug).slice(0, 8)) {
    try {
      const summary = await (options.request || httpGet)(
        'https://site.api.espn.com/apis/site/v2/sports/soccer/' + partido.espnLeagueSlug + '/summary?event=' + partido.espnEventId
      );
      const plays = Array.isArray(summary.scoringPlays) ? summary.scoringPlays :
        Array.isArray(summary.scoringPlays?.items) ? summary.scoringPlays.items : [];
      const scorers = plays.map((play) => {
        const description = String(play.text || play.type?.text || play.shortText || '');
        const participants = Array.isArray(play.participants) ? play.participants :
          Array.isArray(play.athletesInvolved) ? play.athletesInvolved : [];
        const athlete = participants.map((person) => person.athlete?.displayName || person.displayName || person.name).find(Boolean);
        const goalLike = /goal|gol|penalty|penalti|own goal|autogol/i.test(description) || Boolean(play.type?.id && play.team);
        if (!goalLike || !athlete) return null;
        const minute = play.clock?.displayValue || play.time?.displayValue || (play.period?.number ? play.period.number + 'T' : '');
        return athlete + (minute ? ' (' + minute + ')' : '') + (play.team?.displayName ? ' · ' + play.team.displayName : '');
      }).filter(Boolean);
      if (scorers.length) partido.goleadores = [...new Set(scorers)];
    } catch (err) {
      console.log('  ℹ️ Goleadores no disponibles para ' + partido.equipo1 + ' vs ' + partido.equipo2 + ': ' + err.message);
    }
  }

  const validSources = espn.consultas_correctas + backup.ligas_correctas;
  const cache = {
    fecha: new Date().toISOString(),
    partidos_recientes: partidosRecientes,
    partidos_en_curso: partidosEnCurso,
    partidos_proximos: partidosProximos,
    tabla_posiciones: [],
    tabla_competencia: null,
    resumen: {
      total_recientes: partidosRecientes.length,
      total_en_curso: partidosEnCurso.length,
      total_proximos: partidosProximos.length,
    },
    diagnostico_fuentes: {
      proveedor_principal: 'ESPN',
      proveedor_respaldo: 'TheSportsDB',
      espn: {
        ligas_configuradas: espn.ligas_consultadas,
        ligas_validadas: espn.ligas_validadas,
        consultas_correctas: espn.consultas_correctas,
        errores: espn.errores,
        rango: espn.rango,
        preflight_fecha: espn.preflight_fecha,
      },
      thesportsdb: {
        ligas_consultadas: backup.ligas_consultadas,
        ligas_correctas: backup.ligas_correctas,
        errores: backup.errores,
      },
    },
  };

  fs.writeFileSync('matches-cache.json', JSON.stringify(cache, null, 2));
  console.log('📊 Finalizados: ' + cache.resumen.total_recientes);
  console.log('🔴 En curso: ' + cache.resumen.total_en_curso);
  console.log('📅 Próximos: ' + cache.resumen.total_proximos);
  console.log('🔎 ESPN: ' + espn.ligas_validadas + '/' + espn.ligas_consultadas + ' identificadores validados; consultas válidas: ' + espn.consultas_correctas);
  console.log('🔎 TheSportsDB: ' + backup.ligas_correctas + '/' + backup.ligas_consultadas + ' ligas consultadas');

  if (validSources === 0) {
    const error = new Error('Ninguna fuente de partidos devolvió una respuesta estructurada verificable; generación de partidos bloqueada');
    error.diagnostics = cache.diagnostico_fuentes;
    throw error;
  }
  return cache;
}

if (require.main === module) {
  fetchMatches().catch((err) => {
    console.error('❌ Error en fetch-matches:', err.message);
    fs.writeFileSync('matches-cache.json', JSON.stringify({
      fecha: new Date().toISOString(),
      partidos_recientes: [],
      partidos_en_curso: [],
      partidos_proximos: [],
      tabla_posiciones: [],
      resumen: { total_recientes: 0, total_en_curso: 0, total_proximos: 0 },
      error: err.message,
      diagnostico_fuentes: err.diagnostics || null,
    }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = {
  httpGet, ESPN_LIGAS, THESPORTSDB_LIGAS, validateEspnLeagueConfig,
  normalizeEspnEvent, normalizeTheSportsDbEvents,
  getMatchesFromESPN, getMatchesFromTheSportsDB, fetchMatches,
};
