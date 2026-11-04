'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeEspnStandings,
  normalizeTheSportsDbTable,
  normalizeLeaders,
  getChileContext,
  ESPN_STANDINGS,
  ESPN_LEADERS,
  THESPORTSDB_TABLE,
} = require('../scripts/fetch-chile-context');

test('normaliza la tabla ESPN y ordena por posición oficial', () => {
  const payload = { children: [{ standings: { entries: [
    { team: { displayName: 'Club A', logos: [{ href: 'https://img.example/a.png' }] }, stats: [
      { name: 'rank', value: 1 }, { name: 'points', value: 54 }, { name: 'gamesPlayed', value: 25 },
      { name: 'wins', value: 16 }, { name: 'ties', value: 6 }, { name: 'losses', value: 3 },
      { name: 'pointsFor', value: 45 }, { name: 'pointsAgainst', value: 20 },
    ] },
    { team: { displayName: 'Club B' }, stats: [
      { name: 'rank', value: 2 }, { name: 'points', value: 49 }, { name: 'gamesPlayed', value: 25 },
    ] },
  ] } }] };
  const table = normalizeEspnStandings(payload);
  assert.equal(table.length, 0, 'una tabla parcial no debe presentarse como clasificación completa');
  const full = normalizeEspnStandings({ children: [{ standings: { entries: Array.from({ length: 8 }, (_, i) => ({
    team: { displayName: 'Club ' + i },
    stats: [{ name: 'rank', value: i + 1 }, { name: 'points', value: 50 - i }, { name: 'gamesPlayed', value: 25 }],
  })) } }] });
  assert.equal(full.length, 8);
  assert.equal(full[0].equipo, 'Club 0');
  assert.equal(full[0].pts, 50);
});

test('normaliza la tabla de respaldo TheSportsDB', () => {
  const table = normalizeTheSportsDbTable({ table: Array.from({ length: 8 }, (_, i) => ({
    intRank: String(i + 1), strTeam: 'Equipo ' + i, intPlayed: '25', intPoints: String(40 - i),
    intWin: '10', intDraw: '5', intLoss: '10', intGoalsFor: '30', intGoalsAgainst: '25',
    intGoalDifference: '5', strBadge: 'https://img.example/' + i + '.png',
  })) });
  assert.equal(table.length, 8);
  assert.equal(table[0].pts, 40);
  assert.equal(table[0].escudo, 'https://img.example/0.png');
});

test('extrae líderes estadísticos si la respuesta incluye atletas identificables', () => {
  const players = normalizeLeaders({ categories: [{ name: 'Goles', leaders: [
    { athlete: { displayName: 'Jugador Uno', team: { displayName: 'Club A' } }, displayValue: '12' },
  ] }] });
  assert.equal(players.length, 1);
  assert.equal(players[0].nombre, 'Jugador Uno');
  assert.equal(players[0].valor, '12');
});

test('consulta ESPN primero y usa tabla TheSportsDB solo como respaldo', async () => {
  const calls = [];
  const result = await getChileContext({
    now: new Date('2026-11-04T12:00:00.000Z'),
    request: async url => {
      calls.push(url);
      if (url === ESPN_STANDINGS) throw new Error('ESPN no disponible');
      if (url === THESPORTSDB_TABLE) return { table: Array.from({ length: 8 }, (_, i) => ({
        intRank: String(i + 1), strTeam: 'Equipo ' + i, intPoints: String(30 - i),
      })) };
      if (url === ESPN_LEADERS) return { categories: [] };
      throw new Error('URL inesperada');
    },
  });
  assert.equal(calls[0], ESPN_STANDINGS);
  assert.ok(calls.includes(THESPORTSDB_TABLE));
  assert.equal(result.tabla_fuente, 'TheSportsDB');
  assert.equal(result.tabla_posiciones.length, 8);
});
