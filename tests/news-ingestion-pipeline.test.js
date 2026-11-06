'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { extractArticle, replaceEnrichedArticle } = require('../scripts/fetch-real-news');
const { isEligibleNewsCandidate, newsCandidateRejection, buildItem } = require('../scripts/generate-real-content');

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


test('conserva el artículo enriquecido aunque cambien timestamp y URL canónica', () => {
  const original = {
    title: 'Noticia TNT',
    link: 'https://news.google.com/rss/articles/example',
    timestamp: null,
  };
  const fresh = [original];
  const enriched = {
    ...original,
    link: 'https://www.tntsports.cl/noticia/example',
    timestamp: '2026-11-04T10:00:00.000Z',
    article_body: 'Contenido completo de la noticia. '.repeat(12),
    article_complete: true,
  };
  assert.equal(replaceEnrichedArticle(fresh, original, enriched), true);
  assert.equal(fresh[0], enriched);
  assert.equal(fresh[0].article_complete, true);
  assert.equal(fresh[0].timestamp, enriched.timestamp);
});

test('extrae texto de article sin confundir cierres de contenedores anidados', () => {
  const html = '<html><body><main><article><h1>Noticia</h1>' +
    '<p>' + 'La ANFP confirmó información relevante para el campeonato nacional. '.repeat(5) + '</p>' +
    '</article><section><p>Texto lateral irrelevante.</p></section></main></body></html>';
  const result = extractArticle(html);
  assert.ok(result.body.length >= 300);
  assert.match(result.body, /campeonato nacional/);
});

test('extrae el cuerpo cuando el CMS usa un contenedor article-body', () => {
  const html = '<html><body><div class="article-body">' +
    '<p>' + 'El club informó novedades de su plantel para la próxima fecha del torneo. '.repeat(5) + '</p>' +
    '</div></body></html>';
  const result = extractArticle(html);
  assert.ok(result.body.length >= 300);
  assert.match(result.body, /próxima fecha/);
});

test('la extracción no declara completo un artículo sin cuerpo suficiente', () => {
  const result = extractArticle('<html><head><title>Noticia</title></head><body><article><p>Texto breve.</p></article></body></html>');
  assert.ok(result.body.length < 300);
});

test('un artículo completo, reciente y con fuente/fecha verificadas es elegible', () => {
  assert.equal(isEligibleNewsCandidate(validNews(), now), true);
});

test('acepta un extracto breve atribuido para Short sin exigir artículo completo', () => {
  const item = validNews({
    article_body: '',
    article_complete: false,
    article_chars: 118,
    article_description: 'El club confirmó este viernes una modificación en la programación del próximo encuentro del campeonato, según el comunicado publicado por la institución.',
    link: 'https://www.anfp.cl/noticia/programacion',
  });
  assert.equal(newsCandidateRejection(item, now), null);
  assert.equal(isEligibleNewsCandidate(item, now), true);
  const piece = buildItem(item, 'chile', 1);
  assert.equal(piece._articulo_completo, false);
  assert.equal(piece._formato_recomendado, 'short');
  assert.equal(piece._base_evidencia, 'extracto_rss_atribuido');
  assert.ok(piece.narracion.includes('El club confirmó'));
});

test('no convierte un titular aislado en noticia elegible', () => {
  const item = validNews({
    article_body: '',
    article_complete: false,
    article_description: 'Información de última hora.',
    description: 'Información de última hora.',
  });
  assert.equal(newsCandidateRejection(item, now), 'sin_evidencia_breve_suficiente');
});

test('bloquea enlaces de Google News no resueltos aunque tengan titular y snippet', () => {
  const item = validNews({
    article_body: '',
    article_complete: false,
    article_description: 'El club confirmó este viernes una modificación en la programación del próximo encuentro del campeonato.',
    link: 'https://news.google.com/rss/articles/abc',
  });
  assert.equal(newsCandidateRejection(item, now), 'url_invalida_o_no_editorial');
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


test('diagnostica con precisión por qué una noticia no supera la selección', () => {
  assert.equal(newsCandidateRejection(validNews(), now), null);
  assert.equal(newsCandidateRejection(validNews({ article_complete: false }), now), 'sin_evidencia_breve_suficiente');
  assert.equal(newsCandidateRejection(validNews({ article_body: 'texto breve' }), now), 'sin_evidencia_breve_suficiente');
  assert.equal(newsCandidateRejection(validNews({ fecha_publicacion_verificada: false }), now), 'fecha_no_verificada');
  assert.equal(newsCandidateRejection(validNews({ fuente: 'Google News' }), now), 'fuente_no_identificada');
  assert.equal(newsCandidateRejection(validNews({ timestamp: new Date(now - 80 * 3600000).toISOString() }), now), 'noticia_mayor_72h');
});

test('una noticia elegible produce una pieza narrable con atribución de fuente', () => {
  const item = validNews();
  assert.equal(isEligibleNewsCandidate(item, now), true);
  const piece = buildItem(item, 'chile', 1);
  assert.ok(piece.narracion.length > 180);
  assert.equal(piece._fuente_url, item.link);
  assert.equal(piece._articulo_completo, true);
});

test('resuelve el destino editorial desde el parámetro url de Google News', () => {
  const { extractGoogleNewsTarget } = require('../scripts/fetch-real-news');
  const html = '<a href="https://news.google.com/url?url=https%3A%2F%2Fwww.tntsports.cl%2Fnacional%2Fnota">Abrir</a>';
  assert.equal(extractGoogleNewsTarget(html, ['tntsports.cl']), 'https://www.tntsports.cl/nacional/nota');
});

test('resuelve URL de publisher embebida en atributos y JSON escapado', () => {
  const { extractGoogleNewsTarget } = require('../scripts/fetch-real-news');
  const html = '<div data-n-au="https://www.tntsports.cl/nacional/nota?ref=google&amp;id=7"></div>' +
    '<script>window.data = {"url":"https:\\/\\/www.tntsports.cl\\/nacional\\/otra"}</script>';
  assert.equal(extractGoogleNewsTarget(html, ['tntsports.cl']), 'https://www.tntsports.cl/nacional/nota?ref=google&id=7');
});

test('rechaza destinos Google y dominios que no corresponden a la fuente atribuida', () => {
  const { extractGoogleNewsTarget } = require('../scripts/fetch-real-news');
  assert.equal(extractGoogleNewsTarget('<a href="https://example.com/noticia">x</a>', ['tntsports.cl']), '');
  assert.equal(extractGoogleNewsTarget('<a href="https://news.google.com/articles/abc">x</a>', ['tntsports.cl']), '');
});

test('resuelve destinos publicados mediante meta refresh de Google News', () => {
  const { extractGoogleNewsTarget } = require('../scripts/fetch-real-news');
  const html = '<meta http-equiv="refresh" content="0;url=https%3A%2F%2Fwww.tntsports.cl%2Fnoticia%2Funo">';
  assert.equal(extractGoogleNewsTarget(html, ['tntsports.cl']), 'https://www.tntsports.cl/noticia/uno');
});

test('resuelve destinos publicados mediante window.location.replace', () => {
  const { extractGoogleNewsTarget } = require('../scripts/fetch-real-news');
  const html = '<script>window.location.replace("https://www.tntsports.cl/noticia/dos")</script>';
  assert.equal(extractGoogleNewsTarget(html, ['tntsports.cl']), 'https://www.tntsports.cl/noticia/dos');
});

test('no acepta un redirect de Google hacia un dominio distinto del publisher atribuido', () => {
  const { extractGoogleNewsTarget } = require('../scripts/fetch-real-news');
  const html = '<meta http-equiv="refresh" content="0;url=https://example.org/noticia">';
  assert.equal(extractGoogleNewsTarget(html, ['tntsports.cl']), '');
});

test('enrichArticle usa la URL editorial resuelta y verifica el host esperado', async () => {
  const { enrichArticle } = require('../scripts/fetch-real-news');
  const calls = [];
  const articleBody = '<article><p>' + 'TNT Sports informó novedades verificadas del fútbol chileno para la próxima jornada. '.repeat(6) + '</p></article>';
  const request = async url => {
    calls.push(url);
    if (url.includes('news.google.com')) {
      return {
        finalUrl: 'https://news.google.com/rss/articles/opaque-id',
        body: '<a href="https://www.tntsports.cl/noticia/confirmada">Abrir noticia</a>',
      };
    }
    return {
      finalUrl: 'https://www.tntsports.cl/noticia/confirmada',
      body: articleBody,
    };
  };
  const result = await enrichArticle({
    title: 'TNT Sports informa una noticia relevante del fútbol chileno',
    link: 'https://news.google.com/rss/articles/opaque-id',
    fuente: 'TNT Sports Chile',
    fuente_url_original: 'https://www.tntsports.cl/',
    timestamp: '2026-11-06T12:00:00.000Z',
  }, request);
  assert.equal(calls.length, 2);
  assert.equal(result.link, 'https://www.tntsports.cl/noticia/confirmada');
  assert.equal(result.article_fetch_status, 'complete');
  assert.equal(result.fecha_publicacion_verificada, true);
});

test('enrichArticle conserva error explícito si Google News no revela el publisher URL', async () => {
  const { enrichArticle } = require('../scripts/fetch-real-news');
  const result = await enrichArticle({
    title: 'TNT Sports informa una noticia relevante del fútbol chileno',
    link: 'https://news.google.com/rss/articles/opaque-id',
    fuente: 'TNT Sports Chile',
    fuente_url_original: 'https://www.tntsports.cl/',
    timestamp: '2026-11-06T12:00:00.000Z',
  }, async () => ({
    finalUrl: 'https://news.google.com/rss/articles/opaque-id',
    body: '<html><body>Sin destino editorial en esta página</body></html>',
  }));
  assert.equal(result.article_fetch_status, 'fetch_error');
  assert.match(result.article_fetch_error, /google_news_target_unresolved/);
});
