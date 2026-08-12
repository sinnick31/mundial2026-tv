/**
 * fetch-real-news.js — REAL FOOTBALL NEWSROOM v5
 *
 * Ingiere titulares desde feeds RSS/Google News, guarda la URL de origen,
 * fecha y fuente, y no genera hechos. La etapa editorial posterior solo
 * puede trabajar con información existente en este archivo.
 */

const fs = require('fs');
const https = require('https');
const { RSS_FEEDS, KEYWORDS_FUTBOL } = require('../config/ligas');
const { calcularViralScore, normalizar } = require('./viral-score');

function httpGet(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (!url || redirects > 5) return reject(new Error('URL no válida o demasiadas redirecciones'));
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RealFootballNewsroom/5.0; +https://github.com/sinnick31/mundial2026-tv)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      timeout: 15000,
    }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        return httpGet(res.headers.location, redirects + 1).then(resolve).catch(reject);
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if ((res.statusCode || 500) >= 400) return reject(new Error(`HTTP ${res.statusCode}`));
        resolve(data);
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function getTag(block, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i');
  return decodeXml((block.match(re) || [])[1] || '');
}

function parseFeed(xml) {
  const items = [];
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  for (const block of itemBlocks) {
    const title = getTag(block, 'title');
    const description = getTag(block, 'description');
    const link = getTag(block, 'link');
    const pubDate = getTag(block, 'pubDate');
    if (!title || !link) continue;
    const ts = pubDate && !Number.isNaN(Date.parse(pubDate)) ? new Date(pubDate).toISOString() : new Date().toISOString();
    items.push({ title, description: description.slice(0, 500), link, pubDate, timestamp: ts });
  }
  return items;
}

function esFutbol(item) {
  const text = normalizar(`${item.title} ${item.description}`);
  return KEYWORDS_FUTBOL.some(k => text.includes(normalizar(k)));
}

function similitud(a, b) {
  const A = new Set(normalizar(a).split(' ').filter(w => w.length > 3));
  const B = new Set(normalizar(b).split(' ').filter(w => w.length > 3));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / Math.min(A.size, B.size);
}

function loadCache() {
  try {
    if (fs.existsSync('news-cache.json')) return JSON.parse(fs.readFileSync('news-cache.json', 'utf8'));
  } catch (_) {}
  return { noticias: [], ultima_actualizacion: null };
}

function sourceKey(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch (_) {
    return 'fuente-desconocida';
  }
}

async function main() {
  console.log('📰 REAL FOOTBALL NEWSROOM v5 — ingesta de fuentes reales');
  const cache = loadCache();
  const previous = Array.isArray(cache.noticias) ? cache.noticias : [];
  const fresh = [];

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`📡 ${feed.name}`);
      const xml = await httpGet(feed.url);
      const parsed = parseFeed(xml)
        .filter(esFutbol)
        .slice(0, 12)
        .map(item => ({
          ...item,
          fuente: feed.name,
          fuente_host: sourceKey(item.link),
          categoria_feed: feed.categoria,
          prioridad_fuente: feed.prioridad || 0,
        }));

      for (const item of parsed) {
        if (fresh.some(n => similitud(n.title, item.title) >= 0.65)) continue;
        if (previous.some(n => similitud(n.title, item.title) >= 0.65)) continue;
        const viral = calcularViralScore({ ...item, categoria: item.categoria_feed });
        fresh.push({ ...item, categoria: viral.categoria, equipo_chile: viral.equipoChile, viral_score: viral.score, razones: viral.razones });
      }
    } catch (err) {
      console.log(`  ⚠️ ${err.message}`);
    }
  }

  // Mantener solo información reciente. 72h es el respaldo para fines de semana.
  const now = Date.now();
  const recientes = [...fresh, ...previous]
    .filter(n => {
      const ageH = (now - new Date(n.timestamp || now).getTime()) / 36e5;
      return ageH <= 72;
    })
    .sort((a, b) => (b.prioridad_fuente || 0) - (a.prioridad_fuente || 0) || (b.viral_score || 0) - (a.viral_score || 0) || new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 140);

  const porCategoria = {};
  recientes.forEach(n => { porCategoria[n.categoria] = (porCategoria[n.categoria] || 0) + 1; });

  fs.writeFileSync('news-cache.json', JSON.stringify({
    ultima_actualizacion: new Date().toISOString(),
    total_hoy: fresh.length,
    total_reciente: recientes.length,
    por_categoria: porCategoria,
    noticias: recientes,
  }, null, 2));

  console.log(`✅ Fuentes nuevas: ${fresh.length}`);
  console.log(`✅ Noticias recientes disponibles: ${recientes.length}`);
  console.log(`📊 Categorías: ${JSON.stringify(porCategoria)}`);
}

main().catch(err => {
  console.error(`❌ fetch-real-news: ${err.message}`);
  process.exit(1);
});
