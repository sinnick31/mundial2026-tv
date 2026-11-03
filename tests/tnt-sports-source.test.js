'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { RSS_FEEDS } = require('../config/ligas');
const { parseFeed, esFutbol, sourceKey } = require('../scripts/fetch-real-news');
const { calcularViralScore } = require('../scripts/viral-score');

test('TNT Sports tiene cobertura general y por secciones prioritarias', () => {
  const tnt = RSS_FEEDS.filter(feed => feed.name.startsWith('TNT Sports Chile'));
  assert.ok(tnt.length >= 6, 'debe existir una fuente general y cinco búsquedas específicas');
  assert.ok(tnt.some(feed => feed.name.includes('Fútbol femenino') && feed.categoria === 'femenino'));
  assert.ok(tnt.some(feed => feed.name.includes('Liga de Primera') && feed.categoria === 'chile'));
  assert.ok(tnt.some(feed => feed.name.includes('Ascenso') && feed.categoria === 'chile'));
  const femaleIndex = RSS_FEEDS.findIndex(feed => feed.name === 'TNT Sports Chile — Fútbol femenino');
  const generalIndex = RSS_FEEDS.findIndex(feed => feed.name === 'TNT Sports Chile — noticias generales');
  assert.ok(femaleIndex >= 0 && femaleIndex < generalIndex, 'las secciones específicas deben procesarse antes del feed general para preservar su categoría');
  assert.ok(tnt.every(feed => feed.url.startsWith('https://news.google.com/rss/search?')));
});

test('el parser conserva titular, URL, fecha y atribución RSS', () => {
  const xml = `<?xml version="1.0"?><rss><channel><item>
    <title>Colo Colo confirma una noticia del campeonato</title>
    <description>Información deportiva publicada.</description>
    <link>https://tntsports.cl/noticia-ejemplo</link>
    <pubDate>Tue, 03 Nov 2026 12:00:00 GMT</pubDate>
    <source url="https://tntsports.cl">TNT Sports</source>
  </item></channel></rss>`;
  const [item] = parseFeed(xml);
  assert.equal(item.title, 'Colo Colo confirma una noticia del campeonato');
  assert.equal(item.link, 'https://tntsports.cl/noticia-ejemplo');
  assert.equal(item.fuente_original, 'TNT Sports');
  assert.equal(item.fuente_url_original, 'https://tntsports.cl');
  assert.equal(item.fecha_publicacion_verificada, true);
  assert.equal(esFutbol(item), true);
  assert.equal(sourceKey(item.fuente_url_original), 'tntsports.cl');
});

test('la categoría editorial TNT es reconocida por el puntuador', () => {
  const result = calcularViralScore({
    title: 'Actualidad deportiva del fútbol chileno',
    description: '',
    timestamp: new Date().toISOString(),
    categoria: 'tnt_sports',
  });
  assert.equal(result.categoria, 'tnt_sports');
  assert.ok(result.score > 25);
});
