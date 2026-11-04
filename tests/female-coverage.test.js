'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isFutbolFemenino, typeFor, labelFor, importance } = require('../scripts/generate-real-content');

test('detecta fútbol femenino por título y no confunde etiquetas generales', () => {
  assert.equal(isFutbolFemenino({ title: 'La Roja Femenina prepara su próximo amistoso' }), true);
  assert.equal(isFutbolFemenino({ title: 'Resultados de la Liga Femenina de Chile' }), true);
  assert.equal(isFutbolFemenino({ categoria_feed: 'femenino', title: 'Fecha del campeonato' }), true);
  assert.equal(isFutbolFemenino({ title: 'Colo-Colo prepara el clásico masculino' }), false);
});

test('asigna una categoría y rótulo propios al fútbol femenino', () => {
  const item = { title: 'La Roja Femenina confirma convocatoria', description: '' };
  assert.equal(typeFor(item), 'futbol_femenino');
  assert.equal(labelFor('futbol_femenino'), 'FÚTBOL FEMENINO');
});

test('la puntuación editorial no entrega puntos extra a Colo-Colo por su nombre', () => {
  const base = { title: 'Noticia del campeonato', description: '', timestamp: new Date().toISOString(), viral_score: 50, prioridad_fuente: 80, categoria_feed: 'chile' };
  assert.equal(importance({ ...base, title: 'Colo-Colo anuncia una novedad' }), importance({ ...base, title: 'Universidad de Chile anuncia una novedad' }));
});
