'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { extractArticle } = require('../scripts/fetch-real-news');
const { isEligibleNewsCandidate, buildItem } = require('../scripts/generate-real-content');

const now = Date.parse('2026-11-04T12:00:00.000Z');
function validNews(overrides = {}) {
  return {
    title: 'ANFP confirma una modificación del calendario del fútbol chileno',
    article_title: 'ANFP confirma una modificación del calendario del fútbol chileno',
    article_body: 'La ANFP informó una modificación del calendario de la competición. '.repeat(7),
    article_complete: true,
    article_chars: 430,
    timestamp: new Date(now - 3 * 3600000).toISOString(),
    fecha_publicacion_verificada: true,
    link: 'https://www.anfp.cl/noticia/calendario',
    fuente: 'ANFP',
    fuente_host: 'anfp.cl',
    ...overrides,
  };
}

test('extrae texto de article sin confundir cierres de contenedores anidados', () => {
  const html = '<html><body><main><article><h1>Noticia</h1>' +
    '<p>' + 'La ANFP confirmó información relevante para el campeonato nacional. '.repeat(5) + '</p>' +
    '</article><section><p>Texto lateral irrelevante.</p></section></main></body></html>';
  const result = extractArticle(html);
  assert.ok(result.body.length >= 300);
  assert.match(result.body, /campeonato nacional/);
});

test('la extracción no declara completo un artículo sin cuerpo suficiente', () => {
  const result = extractArticle('<html><head><title>Noticia</title></head><body><article><p>Texto breve.</p></article></body></html>');
  assert.ok(result.body.length < 300);
});

test('un artículo completo, reciente y con fuente/fecha verificadas es elegible', () => {
  assert.equal(isEligibleNewsCandidate(validNews(), now), true);
});

test('se bloquean noticias sin fecha parseable o sin verificación explícita', () => {
  assert.equal(isEligibleNewsCandidate(validNews({ timestamp: 'fecha desconocida' }), now), false);
  assert.equal(isEligibleNewsCandidate(validNews({ timestamp: null }), now), false);
  assert.equal(isEligibleNewsCandidate(validNews({ fecha_publicacion_verificada: false }), now), false);
});

test('se bloquean artículos antiguos, futuros fuera de tolerancia y URL inválida', () => {
  assert.equal(isEligibleNewsCandidate(validNews({ timestamp: new Date(now - 73 * 3600000).toISOString() }), now), false);
  assert.equal(isEligibleNewsCandidate(validNews({ timestamp: new Date(now + 7 * 3600000).toISOString() }), now), false);
  assert.equal(isEligibleNewsCandidate(validNews({ link: 'javascript:alert(1)' }), now), false);
});

test('una noticia elegible produce una pieza narrable con atribución de fuente', () => {
  const item = validNews();
  assert.equal(isEligibleNewsCandidate(item, now), true);
  const piece = buildItem(item, 'chile', 1);
  assert.ok(piece.narracion.length > 180);
  assert.equal(piece._fuente_url, item.link);
  assert.equal(piece._articulo_completo, true);
});
