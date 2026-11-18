/** scraper/news_scraper.js — Recolecta noticias (Chile masc./fem. primero), deduplica con processed_news.json y escribe news_today.json */
const fs = require('fs');
const { httpGet, parseFeed, esFutbol, similitud } = require('../scripts/fetch-real-news');
const { RSS_FEEDS } = require('../config/ligas');
const { calcularViralScore } = require('../scripts/viral-score');
const gnews = (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=es-419&gl=CL&ceid=CL:es-419`;
const EXTRA = [
  { name: 'Transfermarkt Chile', url: gnews('site:transfermarkt.cl OR site:transfermarkt.es Chile'), categoria: 'chile', prioridad: 95 },
  { name: 'ANFP', url: gnews('site:anfp.cl'), categoria: 'chile', prioridad: 100 },
  { name: 'ESPN Chile', url: gnews('site:espn.cl futbol'), categoria: 'chile', prioridad: 96 },
  { name: 'GolTV', url: gnews('site:goltv.tv Chile OR Libertadores'), categoria: 'internacional', prioridad: 60 },
  { name: 'FlashScore', url: gnews('site:flashscore.cl OR site:flashscore.com futbol Chile'), categoria: 'chile', prioridad: 80 },
  { name: 'Selección Femenina', url: gnews('"La Roja Femenina" OR "Campeonato Femenino" Chile'), categoria: 'femenino', prioridad: 98 },
  { name: 'Primera División / Copa Chile', url: gnews('"Primera División" OR "Copa Chile" futbol chileno'), categoria: 'chile', prioridad: 97 },
];
const CAT_BONUS = { chile: 40, femenino: 38, chilenos_exterior: 25, formativo: 10, internacional: 0 };
const PROCESSED = process.env.PROCESSED_FILE || 'processed_news.json';
const OUT = process.env.NEWS_OUT || 'news_today.json';
const MAX_AGE_H = Number(process.env.MAX_AGE_HOURS || 36);
const log = (...a) => console.log(`[scraper ${new Date().toISOString()}]`, ...a);

function loadProcessed() {
  try { return JSON.parse(fs.readFileSync(PROCESSED, 'utf8')); } catch { return { links: [], titles: [] }; }
}

async function main() {
  const processed = loadProcessed();
  const feeds = [...EXTRA, ...RSS_FEEDS.filter(f => ['chile', 'femenino', 'internacional', 'chilenos_exterior'].includes(f.categoria))]
    .sort((a, b) => (b.prioridad || 0) - (a.prioridad || 0)).slice(0, Number(process.env.MAX_FEEDS || 30));
  const all = [];
  for (const feed of feeds) {
    try {
      const items = parseFeed(await httpGet(feed.url));
      log(`OK ${feed.name}: ${items.length}`);
      for (const it of items) all.push({ ...it, feed: feed.name, categoria_feed: feed.categoria, prioridad_feed: feed.prioridad || 0 });
    } catch (e) { log(`WARN ${feed.name}: ${e.message}`); }
  }
  const now = Date.now(), picked = [];
  for (const it of all) {
    if (!esFutbol(it)) continue;
    if (it.timestamp && now - Date.parse(it.timestamp) > MAX_AGE_H * 3600e3) continue;
    if (processed.links.includes(it.link) || processed.titles.some(t => similitud(t, it.title) >= 0.7)) continue;
    if (picked.some(p => p.link === it.link || similitud(p.title, it.title) >= 0.65)) continue;
    const v = calcularViralScore({ ...it, categoria: it.categoria_feed });
    picked.push({ ...it, score: v.score + (CAT_BONUS[it.categoria_feed] || 0) + it.prioridad_feed / 10 });
  }
  picked.sort((a, b) => b.score - a.score);
  const top = picked.slice(0, Number(process.env.TOP_N || 12));
  fs.writeFileSync(OUT, JSON.stringify({ generado: new Date().toISOString(), total: top.length, noticias: top }, null, 2));
  log(`Seleccionadas ${top.length} de ${all.length} → ${OUT}`);
  if (!top.length) process.exitCode = 0;
}

/** Marca como procesadas las noticias usadas (llamado por el uploader/final del pipeline). */
function markProcessed(items) {
  const p = loadProcessed();
  for (const n of items) { p.links.push(n.link); p.titles.push(n.title); }
  p.links = p.links.slice(-2000); p.titles = p.titles.slice(-2000);
  fs.writeFileSync(PROCESSED, JSON.stringify(p, null, 2));
}
if (require.main === module) main().catch(e => { console.error('[scraper] ERROR', e); process.exit(1); });
module.exports = { markProcessed };
