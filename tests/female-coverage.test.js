'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isFutbolFemenino, typeFor, labelFor } = require('../scripts/generate-real-content');

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
