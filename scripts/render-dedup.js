'use strict';
// Historial efímero de renders validados: NO es historial de publicaciones.
const fs = require('node:fs');
const HISTORY_FILE = '.render-history-cache.json';
const WINDOW_MS = 48 * 60 * 60 * 1000;
const { normalize } = require('./content-history');

function canonicalUrl(value) {
  try {
    const u = new URL(String(value || ''));
    if (!['http:', 'https:'].includes(u.protocol)) return '';
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|ref$)/i.test(key)) u.searchParams.delete(key);
    }
    u.hostname = u.hostname.toLowerCase();
    u.pathname = u.pathname.replace(/\/$/, '') || '/';
    u.searchParams.sort();
    return u.toString();
  } catch { return ''; }
}
function cleanItems(items, now = Date.now()) {
  return (Array.isArray(items) ? items : []).filter(item => {
    const date = Date.parse(item?.rendered_at || '');
    return Number.isFinite(date) && date <= now && now - date < WINDOW_MS;
  }).slice(-250);
}
function readHistory(file = HISTORY_FILE, now = Date.now()) {
  try { return cleanItems(JSON.parse(fs.readFileSync(file, 'utf8')).items, now); }
  catch { return []; }
}
function similarTitle(a, b) {
  const left = new Set(normalize(String(a || '')).split(' ').filter(Boolean));
  const right = new Set(normalize(String(b || '')).split(' ').filter(Boolean));
  if (!left.size || !right.size) return false;
  const common = [...left].filter(word => right.has(word)).length;
  return common / new Set([...left, ...right]).size > 0.6;
}
function wasRendered(items, news) {
  const url = canonicalUrl(news.link || news._fuente_url);
  const title = news.article_title || news.title || news._noticia_original || news.titulo_youtube;
  return items.some(item => (url && item.url && url === item.url) || similarTitle(title, item.title));
}
function recordValidatedRender({ report, packageData, items = [], now = Date.now() }) {
  if (report?.modo !== 'render-only' || !Array.isArray(report.videos) ||
      !Array.isArray(packageData?.contenido) || report.total !== packageData.contenido.length ||
      report.total < 1 || report.videos.length !== report.total ||
      !report.videos.every(v => v.estado === 'RENDERED_LOCAL' && v.archivo_local && v.calidad)) {
    throw new Error('No se registra un render sin validación completa.');
  }
  const next = cleanItems(items, now);
  for (const story of packageData.contenido) {
    const url = canonicalUrl(story._fuente_url);
    const title = story._noticia_original || story.titulo_youtube;
    if (!url && !title) throw new Error('Noticia sin identidad verificable');
    if (!wasRendered(next, { link: url, title })) next.push({ url, title, rendered_at: new Date(now).toISOString() });
  }
  return cleanItems(next, now);
}
if (require.main === module) {
  const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const packageData = JSON.parse(fs.readFileSync('daily-content.json', 'utf8'));
  const items = recordValidatedRender({ report, packageData, items: readHistory() });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify({ items }, null, 2) + '\n');
  console.log('Renders validados en ventana de 48 h:', items.length);
}
module.exports = { canonicalUrl, cleanItems, readHistory, similarTitle, wasRendered, recordValidatedRender };
