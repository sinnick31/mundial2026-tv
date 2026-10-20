'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeJson, mergeEditorialStates } = require('../scripts/reconcile-editorial-state');

test('conserva entradas distintas del historial remoto y local', () => {
  const remote = { items: [{ hook: 'remoto', fecha: '2026-10-20T10:00:00Z' }] };
  const local = { items: [{ hook: 'local', fecha: '2026-10-20T11:00:00Z' }] };
  const merged = mergeJson(remote, local);
  assert.deepEqual(merged.items.map(x => x.hook), ['remoto', 'local']);
});

test('elimina duplicados exactos del historial sin eliminar entradas nuevas', () => {
  const item = { match_id: null, tipo_contenido: 'noticia', hook: 'gol', fecha: '2026-10-20T10:00:00Z' };
  const merged = mergeJson({ items: [item] }, { items: [item, { ...item, hook: 'otro' }] });
  assert.equal(merged.items.length, 2);
});

test('fusiona noticias por URL y conserva artículos de ambas ejecuciones', () => {
  const merged = mergeJson(
    { noticias: [{ link: 'https://example.com/a', title: 'A' }, { link: 'https://example.com/b', title: 'B' }] },
    { noticias: [{ link: 'https://example.com/a', title: 'A actualizado' }, { link: 'https://example.com/c', title: 'C' }] }
  );
  assert.equal(merged.noticias.length, 3);
  assert.equal(merged.noticias.find(x => x.link.endsWith('/a')).title, 'A actualizado');
});

test('mantiene los contadores de la ejecución actual y no supera los límites', () => {
  const remoteHistory = { items: Array.from({length: 510}, (_, i) => ({ hook: String(i), fecha: new Date(1000 * i).toISOString() })) };
  const localHistory = { items: [{ hook: 'nuevo', fecha: '2026-10-20T00:00:00Z' }] };
  const result = mergeEditorialStates(remoteHistory, localHistory,
    { total_hoy: 10, noticias: [{ link: 'r' }] },
    { total_hoy: 4, noticias: [{ link: 'l' }] });
  assert.equal(result.history.items.length, 500);
  assert.equal(result.cache.total_hoy, 4);
  assert.equal(result.cache.noticias.length, 2);
});
