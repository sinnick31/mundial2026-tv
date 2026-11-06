'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const template = require('../content/manual/la-u-antofagasta-2026-11-05.json');
const { prepareManualPackage } = require('../scripts/prepare-manual-package');

test('prepara la noticia de La U con fuentes TNT Sports y ficha oficial', () => {
  const now = new Date('2026-11-06T20:00:00.000Z');
  const pkg = prepareManualPackage(template, now);
  assert.equal(pkg.total, 1);
  assert.equal(pkg.fecha, '2026-11-06');
  assert.equal(pkg.contenido[0]._fuente, 'TNT Sports Chile');
  assert.match(pkg.contenido[0].narracion, /Octavio Rivero/);
  assert.match(pkg.contenido[0].descripcion_youtube, /udechile\.cl/);
});

test('bloquea el paquete manual cuando la noticia supera 72 horas', () => {
  const now = new Date('2026-11-10T20:00:00.000Z');
  assert.throws(() => prepareManualPackage(template, now), /MANUAL_PACKAGE_STALE/);
});

test('bloquea una fuente principal que no sea TNT Sports Chile', () => {
  const altered = structuredClone(template);
  altered.contenido[0]._fuente_url = 'https://example.com/noticia';
  assert.throws(() => prepareManualPackage(altered, new Date('2026-11-06T20:00:00.000Z')), /fuentes no coinciden/);
});
