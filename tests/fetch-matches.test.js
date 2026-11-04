'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ESPN_LIGAS,
  THESPORTSDB_LIGAS,
  validateEspnLeagueConfig,
  getMatchesFromESPN,
  normalizeTheSportsDbEvents,
  getMatchesFromTheSportsDB,
} = require('../scripts/fetch-matches');

const now = new Date('2026-11-04T12:00:00.000Z');
const noWait = async () => {};

test('los identificadores ESPN tienen formato válido y no están duplicados', () => {
  const result = validateEspnLeagueConfig();
  assert.equal(result.valid, true);
  assert.equal(result.total, 18);
  assert.deepEqual(result.errors, []);
  assert.equal(validateEspnLeagueConfig([{ slug: 'bad slug', nombre: 'Inválida' }]).valid, false);
  assert.equal(validateEspnLeagueConfig([{ slug: 'eng.1' }, { slug: 'eng.1' }]).valid, false);
});

test('ESPN prevalidates all league IDs with a single controlled date before monthly scoreboards', async () => {
  const calls = [];
  const result = await getMatchesFromESPN({
    now,
    sleep: noWait,
    request: async (url) => {
      calls.push(url);
      return { events: [] };
    },
  });

  const probes = calls.filter((url) => url.includes('dates=20261104'));
  const monthQueries = calls.filter((url) => url.includes('dates=202611'));
  assert.equal(probes.length, ESPN_LIGAS.length);
  assert.equal(monthQueries.length, ESPN_LIGAS.length);
  assert.equal(calls.some((url) => /dates=\d{8}-\d{8}/.test(url)), false);
  assert.equal(result.ligas_validadas, ESPN_LIGAS.length);
  assert.equal(result.consultas_correctas, ESPN_LIGAS.length);
  assert.deepEqual(result.rango, { desde: '2026-11-01', hasta: '2026-11-11' });
});

test('un identificador ESPN que responde HTTP 400 no se usa en la consulta mensual', async () => {
  const calls = [];
  const result = await getMatchesFromESPN({
    now,
    sleep: noWait,
    request: async (url) => {
      calls.push(url);
      if (url.includes('/chi.copa_chi/')) throw new Error('HTTP 400');
      return { events: [] };
    },
  });
  assert.equal(calls.some((url) => url.includes('/chi.copa_chi/') && url.includes('dates=202611')), false);
  assert.equal(result.ligas_validadas, ESPN_LIGAS.length - 1);
  assert.ok(result.errores.some((entry) => entry.slug === 'chi.copa_chi' && entry.etapa === 'validacion_id'));
});

test('TheSportsDB normaliza resultados y calendario chilenos solo con datos completos', () => {
  const normalized = normalizeTheSportsDbEvents([
    {
      idEvent: '1001',
      dateEvent: '2026-11-03',
      strStatus: 'Match Finished',
      strHomeTeam: 'Equipo A',
      strAwayTeam: 'Equipo B',
      intHomeScore: '2',
      intAwayScore: '1',
      strLeague: 'Chile Primera Division',
    },
    {
      idEvent: '1002',
      dateEvent: '2026-11-05',
      strStatus: 'Not Started',
      strHomeTeam: 'Equipo C',
      strAwayTeam: 'Equipo D',
      intHomeScore: null,
      intAwayScore: null,
      strLeague: 'Chile Primera Division',
    },
    {
      idEvent: '1003',
      dateEvent: '2026-11-02',
      strStatus: 'Unknown',
      strHomeTeam: 'Equipo E',
      strAwayTeam: 'Equipo F',
      intHomeScore: null,
      intAwayScore: null,
    },
  ], THESPORTSDB_LIGAS[0], now);

  assert.equal(normalized.recientes.length, 1);
  assert.equal(normalized.recientes[0].golesLocal, 2);
  assert.equal(normalized.recientes[0].fuente, 'TheSportsDB');
  assert.equal(normalized.proximos.length, 1);
  assert.equal(normalized.proximos[0].estado, 'programado');
  assert.equal(normalized.enCurso.length, 0);
});

test('TheSportsDB consulta solo las dos ligas chilenas con ID y temporada definidos', async () => {
  const calls = [];
  const result = await getMatchesFromTheSportsDB({
    now,
    sleep: noWait,
    request: async (url) => {
      calls.push(url);
      return { events: [] };
    },
  });
  assert.equal(calls.length, 2);
  assert.ok(calls.some((url) => url.includes('id=4627&s=2026')));
  assert.ok(calls.some((url) => url.includes('id=4899&s=2026')));
  assert.equal(result.ligas_correctas, 2);
  assert.deepEqual(result.errores, []);
});

test('TheSportsDB rechaza respuestas que no contienen events[]', async () => {
  const result = await getMatchesFromTheSportsDB({
    now,
    sleep: noWait,
    request: async () => ({ events: null }),
  });
  assert.equal(result.ligas_correctas, 0);
  assert.equal(result.errores.length, 2);
});
