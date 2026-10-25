'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateItemForRender } = require('../scripts/content-quality-gate');

function validItem() {
  return {
    gancho: 'FÚTBOL CHILENO: noticia confirmada',
    narracion: 'Esta narración explica el hecho publicado, aporta contexto y distingue la información confirmada de la interpretación editorial. '.repeat(2),
    _noticia_original: 'Noticia deportiva verificada',
    _fuente: 'Medio deportivo',
    titulo_youtube: 'FÚTBOL CHILENO: noticia y contexto | Lo que cambia',
    descripcion_youtube: 'Hecho confirmado y contexto editorial. Fuente: https://example.com/noticia',
    _fuente_url: 'https://example.com/noticia',
    puntos: ['HECHO PUBLICADO: noticia deportiva', 'CONTEXTO EDITORIAL: explicación del hecho'],
    _tipo_contenido: 'noticia',
    _match_id: null,
  };
}

test('acepta una pieza con campos legibles y fuente', () => {
  assert.deepEqual(validateItemForRender(validItem()), { ok: true });
});

test('bloquea caracteres corruptos antes de renderizar', () => {
  const item = validItem();
  item.gancho = 'FÃºtbol chileno';
  assert.throws(() => validateItemForRender(item), /caracteres dañados/);
});

test('bloquea marcadores técnicos en metadatos visibles', () => {
  const item = validItem();
  item.titulo_youtube = 'Noticia undefined del fútbol chileno';
  assert.throws(() => validateItemForRender(item), /marcador técnico/);
});

test('bloquea titulares sin contenido útil', () => {
  const item = validItem();
  item.puntos = ['x'];
  assert.throws(() => validateItemForRender(item), /puntos de contenido legibles/);
});

test('bloquea un partido sin nombres concretos de ambos equipos', () => {
  const item = validItem();
  item._tipo_contenido = 'narrativa';
  item.equipo1 = 'Fútbol chileno';
  item.equipo2 = 'Coquimbo Unido';
  assert.throws(() => validateItemForRender(item), /nombres concretos de ambos equipos/);
});

test('acepta un partido con ambos equipos identificados', () => {
  const item = validItem();
  item._tipo_contenido = 'narrativa';
  item.equipo1 = 'Colo-Colo';
  item.equipo2 = 'Coquimbo Unido';
  item._goles_local = 2;
  item._goles_visita = 1;
  assert.deepEqual(validateItemForRender(item), { ok: true });
});

test('bloquea caracteres corruptos en el texto que se dibuja en pantalla', () => {
  const item = validItem();
  item.descripcion = 'La noticia es FÃºtbol chileno';
  assert.throws(() => validateItemForRender(item), /caracteres dañados en texto visible/);
});

test('bloquea entidades HTML que aparecerían literalmente en pantalla', () => {
  const item = validItem();
  item.subtitulo = 'La noticia &nbsp; del partido';
  assert.throws(() => validateItemForRender(item), /entidades HTML sin decodificar/);
});

test('bloquea entidades HTML en la narración y detalla el campo', () => {
  const item = validItem();
  item.narracion = 'La noticia incluye &amp; y más contexto editorial.';
  assert.throws(() => validateItemForRender(item), /entidades HTML sin decodificar en narracion/);
});

test('bloquea etiquetas HTML en el título antes de renderizar', () => {
  const item = validItem();
  item.titulo_youtube = '<b>FÚTBOL CHILENO</b>: noticia y contexto';
  assert.throws(() => validateItemForRender(item), /etiquetas HTML sin limpiar en titulo_youtube/);
});
