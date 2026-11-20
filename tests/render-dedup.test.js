'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { canonicalUrl, cleanItems, wasRendered, recordValidatedRender } = require('../scripts/render-dedup');
const now = Date.parse('2026-11-20T12:00:00Z');
const story = { _fuente_url: 'https://example.org/noticia?utm_source=feed', _noticia_original: 'Final de la liga femenina chilena' };
const report = { modo: 'render-only', total: 1, videos: [{ estado: 'RENDERED_LOCAL', archivo_local: 'out/video.mp4', calidad: true }] };
const packageData = { contenido: [story] };
test('solo registra un render local completamente validado', () => {
  assert.throws(() => recordValidatedRender({ report: { ...report, videos: [{ estado: 'FAILED' }] }, packageData, now }));
  const items = recordValidatedRender({ report, packageData, now });
  assert.equal(items.length, 1);
  assert.equal(items[0].url, 'https://example.org/noticia');
});
test('bloquea misma URL o titular dentro de 48 horas', () => {
  const items = recordValidatedRender({ report, packageData, now });
  assert.equal(wasRendered(items, { link: 'https://example.org/noticia?utm_campaign=x', title: 'Otro titular' }), true);
  assert.equal(wasRendered(items, { link: 'https://other.org/', title: 'Final de la liga femenina chilena' }), true);
  assert.equal(wasRendered(items, { link: 'https://other.org/', title: 'Resultado de otro partido' }), false);
});
test('caduca exactamente a las 48 horas y permite novedades', () => {
  const items = recordValidatedRender({ report, packageData, now });
  assert.equal(cleanItems(items, now + 48 * 3600 * 1000).length, 0);
});
test('un paquete con publicaciones no altera el historial de renders', () => {
  assert.throws(() => recordValidatedRender({ report: { ...report, modo: 'upload' }, packageData, now }));
});
test('URL inválida no se usa como identidad', () => assert.equal(canonicalUrl('javascript:alert(1)'), ''));
