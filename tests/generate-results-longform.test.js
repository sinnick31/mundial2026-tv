'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSections } = require('../scripts/generate-results-longform');

test('resumen largo explica el resultado sin avisos técnicos sobre datos ausentes', () => {
  const now = Date.now();
  const cache = {
    partidos_recientes: [{
      estado: 'finalizado',
      equipo1: 'Colo-Colo',
      equipo2: 'Coquimbo Unido',
      golesLocal: 2,
      golesVisita: 0,
      competencia: 'Liga de Primera',
      fecha: new Date(now - 60 * 60 * 1000).toISOString(),
      fuente: 'TNT Sports Chile',
      url: 'https://www.tntsports.cl/noticia',
    }],
    partidos_proximos: [{
      equipo1: 'Universidad de Chile',
      equipo2: 'Universidad Católica',
      fecha: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
      competencia: 'Liga de Primera',
      fuente: 'ANFP',
      url: 'https://www.anfp.cl/fixture',
    }],
  };
  const result = buildSections(cache);
  assert.equal(result.recent.length, 1);
  assert.equal(result.upcoming.length, 1);
  assert.match(result.recent[0].cuerpo, /Colo-Colo se quedó con la victoria/);
  assert.doesNotMatch(result.recent[0].cuerpo, /la fuente no entrega|no los inferimos|datos disponibles/i);
  assert.match(result.upcoming[0].cuerpo, /Se juega/);
});

test('deduplica resultados del mismo encuentro y fecha', () => {
  const match = {
    estado: 'finalizado', equipo1: 'Palestino', equipo2: 'Audax Italiano',
    golesLocal: 1, golesVisita: 1, competencia: 'Liga de Primera',
    fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  };
  const result = buildSections({ partidos_recientes: [match, { ...match }], partidos_proximos: [] });
  assert.equal(result.recent.length, 1);
  assert.match(result.recent[0].cuerpo, /empate/i);
});
