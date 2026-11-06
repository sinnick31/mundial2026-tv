'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { RSS_FEEDS } = require('../config/ligas');
const { parseFeed, esFutbol, sourceKey, extractArticle, parseTntHomepage, plainText, decodeHtml, extractGoogleNewsTarget, expectedSourceHosts } = require('../scripts/fetch-real-news');
const { calcularViralScore } = require('../scripts/viral-score');
const { sourceTier, sourceTierBonus, importance } = require('../scripts/generate-real-content');

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

test('extrae el cuerpo del artículo desde párrafos y metadatos HTML', () => {
  const html = `<!doctype html><html><head>
    <meta property="og:title" content="Colo-Colo prepara su próximo partido">
    <meta property="og:description" content="La previa del encuentro">
    <link rel="canonical" href="https://www.tntsports.cl/noticia/colo-colo">
  </head><body><header>Menú</header><article>
    <h1>Colo-Colo prepara su próximo partido</h1>
    <p>El equipo retomó los entrenamientos esta semana con miras al encuentro que disputará por el campeonato nacional.</p>
    <p>El cuerpo técnico trabajó aspectos tácticos y evaluará a los jugadores disponibles durante las próximas sesiones.</p>
    <p>La programación del partido y las novedades de la convocatoria serán comunicadas por el club en sus canales oficiales.</p>
  </article><script>var ignored = "No debe aparecer en el texto";</script></body></html>`;
  const article = extractArticle(html);
  assert.equal(article.title, 'Colo-Colo prepara su próximo partido');
  assert.equal(article.canonical, 'https://www.tntsports.cl/noticia/colo-colo');
  assert.ok(article.body.length >= 300);
  assert.ok(article.body.includes('cuerpo técnico'));
  assert.ok(!article.body.includes('ignored'));
});

test('prefiere articleBody de schema.org cuando está disponible', () => {
  const body = 'La ANFP confirmó una modificación del calendario del campeonato. '.repeat(8);
  const html = `<html><head><script type="application/ld+json">${JSON.stringify({
    '@context':'https://schema.org','@type':'NewsArticle','headline':'Cambio de calendario','articleBody':body
  })}</script></head><body><p>Publicidad</p></body></html>`;
  const article = extractArticle(html);
  assert.ok(article.body.includes('modificación del calendario'));
  assert.ok(article.body.length >= 300);
});

test('decodifica entidades HTML y elimina etiquetas visibles', () => {
  assert.equal(decodeHtml('Colo&nbsp;Colo &amp; La Roja &#8211; fútbol'), 'Colo Colo & La Roja – fútbol');
  assert.equal(plainText('<p>La <strong>noticia</strong> está confirmada.</p>'), 'La noticia está confirmada.');
});

test('descubre noticias desde enlaces de la portada oficial de TNT Sports', () => {
  const html = `<html><body>
    <a href="/noticia/colo-colo-prepara-el-clasico"><h2>Colo-Colo prepara el clásico y define su formación</h2></a>
    <a href="/seccion/nacional">Nacional</a>
    <a href="https://example.com/noticia">Colo-Colo gana el partido</a>
  </body></html>`;
  const stories = parseTntHomepage(html);
  assert.equal(stories.length, 1);
  assert.equal(stories[0].fuente, 'TNT Sports Chile');
  assert.equal(stories[0].fuente_host, 'tntsports.cl');
  assert.match(stories[0].link, /^https:\/\/www\.tntsports\.cl\/noticia\//);
});


test('TNT Sports es primera fuente y ESPN la segunda, antes que el resto de feeds', () => {
  const tnt = RSS_FEEDS.filter(feed => feed.nivel_fuente === 1);
  const espn = RSS_FEEDS.filter(feed => feed.nivel_fuente === 2);
  assert.ok(tnt.length >= 6);
  assert.ok(espn.length >= 2);
  assert.ok(tnt.every(feed => feed.name.startsWith('TNT Sports Chile')));
  assert.ok(espn.every(feed => feed.name.startsWith('ESPN —')));
  assert.ok(Math.min(...tnt.map(feed => feed.prioridad)) > Math.max(...espn.map(feed => feed.prioridad)));
  assert.ok(Math.min(...espn.map(feed => feed.prioridad)) > Math.max(...RSS_FEEDS.filter(feed => !feed.nivel_fuente).map(feed => feed.prioridad)));
  assert.equal(sourceTier({ fuente_host: 'tntsports.cl' }), 1);
  assert.equal(sourceTier({ fuente_host: 'espn.com' }), 2);
  assert.equal(sourceTier({ fuente_host: 'anfp.cl' }), 3);
  assert.equal(sourceTierBonus({ nivel_fuente: 1 }), 30);
  assert.equal(sourceTierBonus({ nivel_fuente: 2 }), 15);
  assert.equal(sourceTierBonus({ nivel_fuente: 3 }), 0);
  const base = { viral_score: 10, nivel_fuente: 3, timestamp: new Date().toISOString() };
  assert.ok(importance({ ...base, nivel_fuente: 1 }) > importance({ ...base, nivel_fuente: 2 }));
  assert.ok(importance({ ...base, nivel_fuente: 2 }) > importance({ ...base, nivel_fuente: 3 }));
});


test('resuelve enlaces Google News hacia el dominio TNT atribuido sin aceptar terceros', () => {
  const html = '<html><body><a href="https://www.tntsports.cl/futbol-chileno/noticia-ejemplo">Noticia</a></body></html>';
  const expected = expectedSourceHosts({ fuente: 'TNT Sports', fuente_url_original: 'https://www.tntsports.cl/' });
  assert.deepEqual(expected, ['tntsports.cl']);
  assert.equal(extractGoogleNewsTarget(html, expected), 'https://www.tntsports.cl/futbol-chileno/noticia-ejemplo');
  const external = '<a href="https://example.com/noticia">Noticia externa</a>';
  assert.equal(extractGoogleNewsTarget(external, expected), '');
});

test('reconoce ESPN como fuente atribuida independiente de TNT', () => {
  const expected = expectedSourceHosts({ fuente: 'ESPN Argentina', fuente_url_original: 'https://www.espn.com.ar/' });
  assert.ok(expected.includes('espn.com'));
  assert.ok(expected.includes('espn.com.ar'));
  assert.equal(extractGoogleNewsTarget('<a href="https://www.espn.com.ar/futbol/noticia">ESPN</a>', expected), 'https://www.espn.com.ar/futbol/noticia');
});


test('resuelve redirecciones Google News que terminan en google.com/url', () => {
  const expected = expectedSourceHosts({ fuente: 'TNT Sports Chile', fuente_url_original: 'https://www.tntsports.cl/' });
  const redirect = '<a href="https://www.google.com/url?sa=t&amp;url=https%3A%2F%2Fwww.tntsports.cl%2Fnoticia%2Fverificada">Google</a>';
  assert.equal(extractGoogleNewsTarget(redirect, expected), 'https://www.tntsports.cl/noticia/verificada');
});

test('no permite que un redirector Google entregue un dominio distinto al editor atribuido', () => {
  const expected = expectedSourceHosts({ fuente: 'ESPN Argentina', fuente_url_original: 'https://www.espn.com.ar/' });
  const redirect = '<a href="https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fnoticia">Google</a>';
  assert.equal(extractGoogleNewsTarget(redirect, expected), '');
});
