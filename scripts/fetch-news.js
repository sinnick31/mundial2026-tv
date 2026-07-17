/**
 * fetch-news.js — FOOTBALL AI STUDIO v4.0
 *
 * ANTES (v3): buscaba solo noticias del Mundial 2026 → el canal moría al terminar el torneo.
 * AHORA (v4): cobertura 365 días del ecosistema completo del fútbol:
 *   🇨🇱 Fútbol chileno (Primera A, Primera B, Copa Chile, La Roja) — PRIORIDAD ALTA
 *   🌍 Champions, Premier, LaLiga, Serie A, Bundesliga, Libertadores, Eliminatorias
 *   💰 Mercado de fichajes | 📊 Récords | 🔥 Polémicas
 *
 * Cada noticia se clasifica por categoría y recibe un VIRAL SCORE 0–100.
 * Solo las mejores pasan a generate-daily-content.js.
 */

const fs = require('fs');
const https = require('https');
const { RSS_FEEDS, KEYWORDS_FUTBOL } = require('../config/ligas');
const { calcularViralScore, normalizar } = require('./viral-score');

// ─── HTTP GET simple (sin dependencias) ──────────────────────────────────────
function httpGet(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 4) return reject(new Error('Demasiadas redirecciones'));
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FootballAIStudio/4.0; +https://github.com/sinnick31/mundial2026-tv)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      timeout: 10000,
    }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        return httpGet(res.headers.location, redirects + 1).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ─── Parser RSS básico ───────────────────────────────────────────────────────
function parseRSS(xmlString) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xmlString)) !== null) {
    const c = match[1];
    const title = (c.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1] || '';
    const desc = (c.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) || [])[1] || '';
    const link = (c.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
    const pubDate = (c.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
    const clean = (t) => t.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
    const cleanTitle = clean(title);
    if (cleanTitle) {
      items.push({
        title: cleanTitle,
        description: clean(desc).substring(0, 300),
        link: link.trim(),
        pubDate: pubDate.trim(),
        timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }
  }
  return items;
}

// ─── ¿Es noticia de fútbol? (filtro global) ──────────────────────────────────
function esFutbol(noticia) {
  const texto = normalizar(`${noticia.title} ${noticia.description}`);
  return KEYWORDS_FUTBOL.some((kw) => texto.includes(kw));
}

// ─── Caché ───────────────────────────────────────────────────────────────────
function loadCache() {
  try {
    if (fs.existsSync('news-cache.json')) return JSON.parse(fs.readFileSync('news-cache.json', 'utf8'));
  } catch (e) { /* caché corrupto → empezar de cero */ }
  return { noticias: [], ultima_actualizacion: null };
}
function saveCache(cache) {
  fs.writeFileSync('news-cache.json', JSON.stringify(cache, null, 2));
}

// ─── Dedup por similitud de titulares (Jaccard sobre palabras) ───────────────
function similares(a, b) {
  const setA = new Set(normalizar(a).split(' ').filter((w) => w.length > 3));
  const setB = new Set(normalizar(b).split(' ').filter((w) => w.length > 3));
  if (!setA.size || !setB.size) return false;
  let inter = 0;
  for (const w of setA) if (setB.has(w)) inter++;
  return inter / Math.min(setA.size, setB.size) >= 0.6;
}

// ─── Pipeline principal ──────────────────────────────────────────────────────
async function fetchNews() {
  console.log('🔍 FOOTBALL AI STUDIO v4.0 — Buscando noticias de fútbol (Chile + Mundo)...\n');

  const cache = loadCache();
  const existentes = cache.noticias || [];
  const nuevas = [];

  for (const feed of RSS_FEEDS) {
    console.log(`📡 ${feed.name}...`);
    try {
      const xml = await httpGet(feed.url);
      const items = parseRSS(xml)
        .filter(esFutbol)
        .filter((item) => !existentes.some((e) => similares(e.title, item.title)))
        .filter((item) => !nuevas.some((e) => similares(e.title, item.title)))
        .slice(0, 8);

      items.forEach((item) => {
        item.fuente = feed.name;
        item.idioma = feed.lang;
        item.categoria = feed.categoria;
        const v = calcularViralScore(item);
        item.viral_score = v.score;
        item.categoria = v.categoria;      // la detección por contenido manda
        item.equipo_chile = v.equipoChile;
        nuevas.push(item);
      });
      console.log(`  ✅ ${items.length} nuevas [${feed.categoria}]`);
    } catch (err) {
      console.log(`  ⚠️ Error: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  // Combinar, ordenar por viral score y recortar
  const todas = [...nuevas, ...existentes]
    .sort((a, b) => (b.viral_score || 0) - (a.viral_score || 0) || new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 80);

  const porCategoria = {};
  todas.forEach((n) => { porCategoria[n.categoria] = (porCategoria[n.categoria] || 0) + 1; });

  saveCache({
    noticias: todas,
    ultima_actualizacion: new Date().toISOString(),
    total_hoy: nuevas.length,
    por_categoria: porCategoria,
  });

  console.log(`\n✅ Caché: ${todas.length} noticias | Nuevas hoy: ${nuevas.length}`);
  console.log(`📊 Por categoría: ${JSON.stringify(porCategoria)}`);
  if (nuevas.length) {
    console.log('\n🔥 Top noticias por viral score:');
    nuevas.sort((a, b) => b.viral_score - a.viral_score).slice(0, 6).forEach((n, i) => {
      console.log(`  ${i + 1}. [${n.viral_score}] [${n.categoria}] ${n.title.substring(0, 80)}`);
    });
  }
}

fetchNews().catch((err) => {
  console.error('❌ Error en fetch-news:', err.message);
  process.exit(0); // no rompe el pipeline — el generador usa partidos como fallback
});
