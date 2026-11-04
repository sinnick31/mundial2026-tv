'use strict';

/**
 * Contexto del Campeonato Nacional para videos largos.
 * ESPN es la fuente principal; TheSportsDB solo se usa como respaldo si
 * devuelve una tabla completa. Los retratos nunca se descargan desde aquí:
 * las imágenes se incorporan únicamente desde PLAYER_IMAGES_JSON autorizado.
 */
const ESPN_STANDINGS = 'https://site.api.espn.com/apis/v2/sports/soccer/chi.1/standings';
const ESPN_LEADERS = 'https://sports.core.api.espn.com/v2/sports/soccer/leagues/chi.1/leaders';
const THESPORTSDB_TABLE = 'https://www.thesportsdb.com/api/v1/json/123/lookuptable.php?l=4627';

function cleanNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function walk(value, visit, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  visit(value);
  if (Array.isArray(value)) value.forEach(item => walk(item, visit, seen));
  else Object.values(value).forEach(item => walk(item, visit, seen));
}

function findEntries(payload) {
  const candidates = [];
  walk(payload, node => {
    if (Array.isArray(node.entries) && node.entries.length) candidates.push(node.entries);
  });
  return candidates.sort((a, b) => b.length - a.length)[0] || [];
}

function statMap(entry) {
  const result = {};
  const stats = Array.isArray(entry.stats) ? entry.stats : [];
  for (const stat of stats) {
    const key = String(stat.name || stat.abbreviation || stat.displayName || '').toLowerCase();
    if (key) result[key] = cleanNumber(stat.value ?? stat.displayValue);
  }
  return result;
}

function firstStat(stats, names) {
  for (const name of names) if (stats[name] !== null && stats[name] !== undefined) return stats[name];
  return null;
}

function normalizeEspnStandings(payload, updatedAt = new Date().toISOString()) {
  const entries = findEntries(payload);
  const rows = entries.map(entry => {
    const team = entry.team || entry;
    const stats = statMap(entry);
    const rank = firstStat(stats, ['rank', 'playoffseed']) ?? cleanNumber(entry.rank);
    const points = firstStat(stats, ['points', 'pts']);
    const played = firstStat(stats, ['gamesplayed', 'played', 'matchesplayed', 'gp']);
    const wins = firstStat(stats, ['wins', 'win', 'w']);
    const draws = firstStat(stats, ['ties', 'draws', 'draw', 'd']);
    const losses = firstStat(stats, ['losses', 'loss', 'l']);
    const goalsFor = firstStat(stats, ['pointsfor', 'goalsfor', 'gf']);
    const goalsAgainst = firstStat(stats, ['pointsagainst', 'goalsagainst', 'ga']);
    const goalDiff = firstStat(stats, ['pointdifferential', 'goaldifference', 'gd']);
    const logo = team.logo || team.logos?.[0]?.href || team.logos?.[0]?.url || '';
    return {
      posicion: rank,
      equipo: team.displayName || team.name || team.shortDisplayName || '',
      escudo: /^https:\/\//i.test(logo) ? logo : '',
      pj: played, pg: wins, pe: draws, pp: losses,
      gf: goalsFor, gc: goalsAgainst,
      dif: goalDiff ?? (goalsFor !== null && goalsAgainst !== null ? goalsFor - goalsAgainst : null),
      pts: points,
    };
  }).filter(row => row.equipo && row.pts !== null);
  rows.sort((a, b) => (a.posicion ?? 999) - (b.posicion ?? 999) || (b.pts - a.pts));
  if (rows.length < 8) return [];
  return rows.map((row, index) => ({ ...row, posicion: row.posicion ?? index + 1 }));
}

function normalizeTheSportsDbTable(payload) {
  const rows = Array.isArray(payload.table) ? payload.table : [];
  return rows.map(row => ({
    posicion: cleanNumber(row.intRank),
    equipo: String(row.strTeam || '').trim(),
    escudo: /^https:\/\//i.test(row.strBadge || '') ? row.strBadge : '',
    pj: cleanNumber(row.intPlayed), pg: cleanNumber(row.intWin),
    pe: cleanNumber(row.intDraw), pp: cleanNumber(row.intLoss),
    gf: cleanNumber(row.intGoalsFor), gc: cleanNumber(row.intGoalsAgainst),
    dif: cleanNumber(row.intGoalDifference), pts: cleanNumber(row.intPoints),
  })).filter(row => row.equipo && row.pts !== null)
    .sort((a, b) => (a.posicion ?? 999) - (b.posicion ?? 999));
}

function normalizeLeaders(payload) {
  const players = [];
  const seen = new Set();
  walk(payload, node => {
    const athlete = node.athlete && typeof node.athlete === 'object' ? node.athlete : null;
    if (!athlete) return;
    const name = String(athlete.displayName || athlete.fullName || athlete.name || '').trim();
    if (!name || seen.has(name.toLowerCase())) return;
    const category = String(node.category?.name || node.category?.displayName || node.name || 'Estadística');
    const value = node.displayValue ?? node.value ?? node.statistics?.[0]?.displayValue ?? '';
    if (!String(value).trim()) return;
    seen.add(name.toLowerCase());
    players.push({
      nombre: name,
      equipo: athlete.team?.displayName || athlete.team?.name || '',
      categoria: category,
      valor: String(value),
      fuente: 'ESPN',
      url: athlete.links?.web?.href || athlete.href || 'https://www.espn.com/soccer/',
    });
  });
  return players.slice(0, 8);
}

async function getChileContext(options = {}) {
  const request = options.request;
  if (typeof request !== 'function') throw new Error('Se requiere una función request para consultar el contexto chileno.');
  const now = options.now || new Date();
  let tabla = [];
  let tablaFuente = '';
  let tablaError = '';
  try {
    const data = await request(ESPN_STANDINGS);
    tabla = normalizeEspnStandings(data, now.toISOString());
    if (tabla.length) tablaFuente = 'ESPN';
    else throw new Error('ESPN no entregó una tabla de posiciones completa');
  } catch (error) {
    tablaError = error.message;
    try {
      const data = await request(THESPORTSDB_TABLE);
      tabla = normalizeTheSportsDbTable(data);
      if (tabla.length >= 8) tablaFuente = 'TheSportsDB';
      else throw new Error('TheSportsDB no entregó una tabla completa');
    } catch (fallbackError) {
      tablaError += '; respaldo: ' + fallbackError.message;
      tabla = [];
    }
  }

  let jugadores = [];
  let jugadoresError = '';
  try {
    const leaders = await request(ESPN_LEADERS);
    jugadores = normalizeLeaders(leaders);
    if (!jugadores.length) jugadoresError = 'ESPN no entregó líderes individuales utilizables';
  } catch (error) {
    jugadoresError = error.message;
  }

  return {
    tabla_posiciones: tabla,
    tabla_competencia: tabla.length ? 'Campeonato Nacional de Primera División de Chile' : null,
    tabla_fuente: tablaFuente,
    tabla_actualizada: now.toISOString(),
    tabla_url: tablaFuente === 'ESPN' ? ESPN_STANDINGS : tablaFuente === 'TheSportsDB' ? THESPORTSDB_TABLE : '',
    tabla_error: tablaError,
    jugadores_destacados: jugadores,
    jugadores_fuente: jugadores.length ? 'ESPN' : '',
    jugadores_url: jugadores.length ? ESPN_LEADERS : '',
    jugadores_error: jugadoresError,
  };
}

module.exports = {
  ESPN_STANDINGS, ESPN_LEADERS, THESPORTSDB_TABLE,
  normalizeEspnStandings, normalizeTheSportsDbTable, normalizeLeaders, getChileContext,
};
