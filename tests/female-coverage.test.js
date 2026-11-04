'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isFutbolFemenino, typeFor, labelFor, importance, isEligibleCandidate } = require('../scripts/generate-real-content');

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

function candidate(overrides = {}) {
  return {
    title: 'Club anuncia una medida deportiva relevante',
    description: 'Información de contexto para la noticia.',
    link: 'https://medio.example/noticia-futbol',
    fuente: 'Medio deportivo identificable',
    timestamp: new Date().toISOString(),
    fecha_publicacion_verificada: true,
    article_complete: true,
    article_body: 'Contenido periodístico recuperado y suficiente para contextualizar la noticia. '.repeat(6),
    ...overrides,
  };
}

test('el generador acepta solo artículos completos con fuente y fecha verificadas', () => {
  assert.equal(isEligibleCandidate(candidate()), true);
});

test('el generador bloquea noticias sin fecha verificada', () => {
  assert.equal(isEligibleCandidate(candidate({ fecha_publicacion_verificada: false })), false);
  assert.equal(isEligibleCandidate(candidate({ timestamp: null })), false);
});

test('el generador bloquea noticias antiguas', () => {
  const old = new Date(Date.now() - 73 * 3600000).toISOString();
  assert.equal(isEligibleCandidate(candidate({ timestamp: old })), false);
});

test('el generador bloquea URLs o fuentes genéricas', () => {
  assert.equal(isEligibleCandidate(candidate({ link: 'javascript:alert(1)' })), false);
  assert.equal(isEligibleCandidate(candidate({ fuente: 'Fuente deportiva' })), false);
});
