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

function httpGetResponse(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(url); } catch { return reject(new Error('URL no válida')); }
    if (!['https:', 'http:'].includes(parsed.protocol) || redirects > 6) return reject(new Error('URL no válida o demasiadas redirecciones'));
    const transport = parsed.protocol === 'https:' ? https : require('http');
    const req = transport.get(parsed, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChilensisFootballNewsroom/6.0; +https://github.com/sinnick31/mundial2026-tv)',
        Accept: 'text/html,application/xhtml+xml,application/rss+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CL,es;q=0.9,en;q=0.6',
      },
      timeout: 18000,
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const next = new URL(res.headers.location, parsed).toString();
        res.resume();
        return httpGetResponse(next, redirects + 1).then(resolve).catch(reject);
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if ((res.statusCode || 500) >= 400) return reject(new Error(`HTTP ${res.statusCode}`));
        resolve({ body: data, finalUrl: parsed.toString(), contentType: res.headers['content-type'] || '' });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}
async function httpGet(url, redirects = 0) {
  return (await httpGetResponse(url, redirects)).body;
}

function httpPostForm(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(url); } catch { return reject(new Error('URL no válida')); }
    const payload = Buffer.from(String(body || ''), 'utf8');
    const req = https.request(parsed, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ChilensisFootballNewsroom/6.0; +https://github.com/sinnick31/mundial2026-tv)',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Content-Length': payload.length,
        'Accept-Language': 'es-CL,es;q=0.9,en;q=0.6',
        ...headers,
      },
      timeout: 18000,
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if ((res.statusCode || 500) >= 400) return reject(new Error(`HTTP ${res.statusCode}`));
        resolve({ body: data, statusCode: res.statusCode });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(payload);
    req.end();
  });
}

async function resolveGoogleNewsBatchExecute(html = '', expectedHosts = [], postForm = httpPostForm) {
  const dataPMatch = String(html || '').match(/<c-wiz[^>]+data-p=["']([^"']+)["']/i);
  if (!dataPMatch) return '';
  try {
    const rawP = decodeHtml(dataPMatch[1]).replace(/^%\.@\./, '["garturlreq",');
    const arr = JSON.parse(rawP);
    if (!Array.isArray(arr) || arr.length < 8) return '';
    const reqPayload = JSON.stringify([...arr.slice(0, -6), ...arr.slice(-2)]);
    const fReq = JSON.stringify([[['Fbv4je', reqPayload, null, 'generic']]]);
    const resp = await postForm(
      'https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je',
      'f.req=' + encodeURIComponent(fReq)
    );
    const match = String(resp && resp.body || '').match(/\\?"garturlres\\?",\\?"(https?:[^"\\]+)/i);
    if (!match) return '';
    const candidate = match[1].replace(/\\\//g, '/');
    return extractGoogleNewsTarget(googleRedirectMarkup(candidate), expectedHosts);
  } catch (_) {
    return '';
  }
}

function decodeHtml(value = '') {
  const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', bull: '•', eacute: 'é', Eacute: 'É', aacute: 'á', Aacute: 'Á', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', Ntilde: 'Ñ' };
  return String(value).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code[0] === '#') {
      const number = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(number) && number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : ' ';
    }
    return named[code] || named[code.toLowerCase()] || entity;
  });
}
function plainText(html = '') {
  return decodeHtml(String(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')).trim();
}
function extractMeta(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i'),
  ];
  for (const pattern of patterns) { const match = html.match(pattern); if (match) return decodeHtml(match[1]); }
  return '';
}
function extractArticle(html = '') {
  const blocks = [];
  const jsonLd = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach(visit);
    if (typeof value.articleBody === 'string' && value.articleBody.trim().length > 150) blocks.push(value.articleBody);
    if (value['@graph']) visit(value['@graph']);
    if (value.mainEntity) visit(value.mainEntity);
    if (value.article) visit(value.article);
    if (value.mainEntityOfPage) visit(value.mainEntityOfPage);
  };
  for (const tag of jsonLd) {
    const raw = (tag.match(/>([\s\S]*?)<\/script>/i) || [])[1] || '';
    try { visit(JSON.parse(raw)); } catch (_) { /* JSON-LD inválido: continuar con HTML */ }
  }

  // Buscar cada región por separado: no mezclar <article> con </main> ni tomar
  // todo el documento cuando el sitio usa contenedores anidados.
  const regions = [];
  for (const tag of ['article', 'main']) {
    const re = new RegExp('<' + tag + '\\b[^>]*>[\\s\\S]*?<\\/' + tag + '\\s*>', 'gi');
    for (const match of html.matchAll(re)) regions.push(match[0]);
  }
  // Varios CMS publican el cuerpo en contenedores div/section sin usar <article>.
  const bodyContainers = html.match(/<(div|section)\b(?=[^>]*(?:itemprop=["']articleBody["']|class=["'][^"']*(?:article-body|article-content|story-body|news-content)[^"']*["']))[^>]*>[\s\S]*?<\/\1>/gi) || [];
  regions.push(...bodyContainers);
  const rankedRegions = regions
    .map(region => (region.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || []).map(plainText).filter(t => t.length >= 45).join(' '))
    .sort((x, y) => y.length - x.length);
  const sourceRegionText = rankedRegions[0] || '';
  const paragraphText = sourceRegionText
    ? sourceRegionText
    : (html.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || []).map(plainText)
      .filter(t => t.length >= 45 && !/cookies|suscr[ií]bete|publicidad|t[eé]rminos y condiciones|compartir esta noticia/i.test(t))
      .join(' ');
  const body = [...new Set([...blocks.map(plainText), paragraphText].filter(Boolean))]
    .sort((x, y) => y.length - x.length)[0] || '';
  const title = extractMeta(html, 'og:title') || plainText((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const description = extractMeta(html, 'og:description') || extractMeta(html, 'description');
  const canonicalTag = (html.match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i) || [])[0] || '';
  const canonical = (canonicalTag.match(/href=["']([^"']+)["']/i) || [])[1] || '';
  const datePublished = (html.match(/"datePublished"\s*:\s*"([^"]+)"/i) || [])[1] || extractMeta(html, 'article:published_time');
  return { title, description, body: body.slice(0, 14000), canonical: canonical ? decodeHtml(canonical) : '', datePublished };
}
function parseTntHomepage(html = '') {
  const anchors = html.match(/<a\b[^>]*href=["'][^"']+["'][^>]*>[\s\S]*?<\/a>/gi) || [];
  const found = [];
  for (const anchor of anchors) {
    const href = (anchor.match(/\bhref=["']([^"']+)["']/i) || [])[1] || '';
    if (!href) continue;
    let url;
    try { url = new URL(decodeHtml(href), 'https://www.tntsports.cl/'); } catch (_) { continue; }
    if (!/(^|\.)tntsports\.cl$/i.test(url.hostname) || url.pathname === '/' || /\/(seccion|liga-de-primera|futbol-chileno|futbol-t\d+)(\/|$)/i.test(url.pathname)) continue;
    const title = plainText((anchor.match(/>([\s\S]*?)<\/a>/i) || [])[1] || '')
      || decodeHtml((anchor.match(/\b(?:aria-label|title)=["']([^"']+)["']/i) || [])[1] || '');
    if (title.length < 22 || title.length > 180) continue;
    const item = { title, description: '', link: url.toString(), fuente: 'TNT Sports Chile', fuente_host: 'tntsports.cl', fuente_original: 'TNT Sports Chile', fuente_url_original: 'https://www.tntsports.cl/', categoria_feed: /femenin/i.test(url.pathname + title) ? 'femenino' : 'chile', prioridad_fuente: 130, nivel_fuente: 1 };
    if (!esFutbol(item)) continue;
    if (found.some(existing => existing.link === item.link || similitud(existing.title, item.title) >= 0.65)) continue;
    found.push(item);
  }
  return found.slice(0, 20);
}

function hostMatches(host, expected) {
  const normalized = String(host || '').toLowerCase().replace(/^www\./, '');
  return expected.some(domain => normalized === domain || normalized.endsWith('.' + domain));
}

function isGoogleRedirectHost(host) {
  const normalized = String(host || '').toLowerCase().replace(/^www\./, '');
  return normalized === 'news.google.com' || normalized === 'google.com' || normalized.endsWith('.google.com');
}

function googleRedirectMarkup(url) {
  const safeUrl = String(url || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return '<a href="' + safeUrl + '">Google News redirect</a>';
}

function expectedSourceHosts(item) {
  const source = String(item.fuente || item.fuente_original || item.fuente_host || '').toLowerCase();
  const sourceUrl = String(item.fuente_url_original || '');
  if (/tnt\s*sports|tntsports\.cl/.test(source + ' ' + sourceUrl)) return ['tntsports.cl'];
  if (/\bespn\b|espn\.com/.test(source + ' ' + sourceUrl)) {
    const hosts = ['espn.com', 'espn.com.ar', 'espn.com.mx', 'espn.com.co', 'espn.com.pe'];
    try {
      const host = new URL(sourceUrl).hostname.replace(/^www\./, '');
      if (host && !hosts.includes(host)) hosts.unshift(host);
    } catch (_) {}
    return hosts;
  }
  try {
    const host = new URL(sourceUrl).hostname.replace(/^www\./, '');
    return host && host !== 'news.google.com' ? [host] : [];
  } catch (_) {
    return [];
  }
}

function extractGoogleNewsTarget(html, expectedHosts = []) {
  const candidates = [];
  const add = value => {
    if (typeof value !== 'string' || !value.trim()) return;
    let decoded = value.trim()
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\\u0026/gi, '&')
      .replace(/\\u003d/gi, '=')
      .replace(/\\u003a/gi, ':')
      .replace(/\\u002f/gi, '/')
      .replace(/\\\//g, '/')
      .replace(/^['"]|['"]$/g, '');
    if (!/^https?:\/\//i.test(decoded) && /https?%3a%2f%2f/i.test(decoded)) {
      try { decoded = decodeURIComponent(decoded); } catch (_) {}
    }
    // Google may double-escape the publisher URL inside its redirect markup.
    for (let pass = 0; pass < 3; pass++) {
      try {
        const parsed = new URL(decoded, 'https://news.google.com/');
        for (const key of ['url', 'u', 'target', 'redirect', 'q', 'article_url']) {
          const nested = parsed.searchParams.get(key);
          if (nested && nested !== decoded) add(nested);
        }
        if (!isGoogleRedirectHost(parsed.hostname)) candidates.push(parsed.toString());
        break;
      } catch (_) {
        try {
          const unescaped = decodeURIComponent(decoded);
          if (unescaped !== decoded) { decoded = unescaped; continue; }
        } catch (_) {}
        break;
      }
    }
  };

  const source = String(html || '');
  if (/^https?:\/\//i.test(source.trim())) add(source.trim());

  // Google News may expose the publisher URL through an intermediate redirect.
  const refreshes = source.match(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi) || [];
  for (const tag of refreshes) {
    const match = tag.match(/content\s*=\s*["'][^"']*?url\s*=\s*([^"']+)["']/i);
    if (match) add(match[1].trim());
  }
  const scripts = [
    /(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']/gi,
    /(?:window\.)?location\.(?:assign|replace)\s*\(\s*["']([^"']+)["']/gi,
  ];
  for (const pattern of scripts) {
    for (const match of source.matchAll(pattern)) add(match[1]);
  }

  const attributes = source.match(/(?:href|data-url|data-n-au|data-href|url)\s*=\s*["'][^"']+["']/gi) || [];
  for (const attribute of attributes) {
    const match = attribute.match(/=\s*["']([^"']+)["']/);
    if (match) add(match[1]);
  }
  const normalizedSource = source
    .replace(/\\u0026/gi, '&').replace(/\\u003d/gi, '=')
    .replace(/\\u003a/gi, ':').replace(/\\u002f/gi, '/')
    .replace(/\\\//g, '/').replace(/&amp;/gi, '&');
  const absolute = normalizedSource.match(/https?:\/\/[^\s"'<>\\]+/gi) || [];
  for (const value of absolute) add(value.replace(/[),.;]+$/g, ''));

  for (const value of candidates) {
    try {
      const url = new URL(value, 'https://news.google.com/');
      if (['http:', 'https:'].includes(url.protocol)
        && !url.username && !url.password
        && !isGoogleRedirectHost(url.hostname)
        && (!expectedHosts.length || hostMatches(url.hostname, expectedHosts))) {
        return url.toString();
      }
    } catch (_) {}
  }
  return '';
}

async function enrichArticle(item, request = httpGetResponse) {
  try {
    const expectedHosts = expectedSourceHosts(item);
    let response = await request(item.link);
    let resolved = new URL(response.finalUrl);
    if (isGoogleRedirectHost(resolved.hostname)) {
      // Google News may redirect through news.google.com OR google.com/url.
      // Inspect the final redirect URL and HTML, accepting only the attributed publisher host.
      const redirectHtml = googleRedirectMarkup(response.finalUrl) + response.body;
      let target = extractGoogleNewsTarget(redirectHtml, expectedHosts);
      if (!target && request === httpGetResponse) {
        target = await resolveGoogleNewsBatchExecute(response.body, expectedHosts);
      }
      if (!target) throw new Error('google_news_target_unresolved:' + resolved.hostname);
      response = await request(target);
      resolved = new URL(response.finalUrl);
    }
    if (expectedHosts.length && !hostMatches(resolved.hostname, expectedHosts)) {
      throw new Error('redirect_outside_expected_source:' + resolved.hostname + ':expected=' + expectedHosts.join(','));
    }
    if (resolved.hostname === 'news.google.com') throw new Error('google_news_target_unresolved');

    const parsed = extractArticle(response.body);
    const canonical = parsed.canonical ? new URL(parsed.canonical, resolved) : resolved;
    if (!['https:', 'http:'].includes(canonical.protocol) || canonical.username || canonical.password) {
      throw new Error('invalid_article_protocol');
    }
    if (expectedHosts.length && !hostMatches(canonical.hostname, expectedHosts)) {
      throw new Error('canonical_outside_expected_source');
    }
    const canonicalUrl = canonical.toString();
    const body = parsed.body.length >= 300 ? parsed.body : '';
    const articleDateValid = Boolean(parsed.datePublished && !Number.isNaN(Date.parse(parsed.datePublished)));
    const feedDateValid = Boolean(item.timestamp && !Number.isNaN(Date.parse(item.timestamp)));
    const articlePublishedAt = articleDateValid ? new Date(parsed.datePublished).toISOString() : null;
    const feedPublishedAt = feedDateValid ? new Date(item.timestamp).toISOString() : null;
    const publishedAt = articlePublishedAt || feedPublishedAt;
    const fetchStatus = body ? 'complete' : (parsed.body.length > 0 ? 'body_too_short' : 'extraction_empty');
    return {
      ...item,
      link: canonicalUrl,
      article_title: parsed.title || item.title,
      article_description: parsed.description || item.description || '',
      article_body: body,
      article_chars: parsed.body.length,
      timestamp: publishedAt,
      pubDate: publishedAt || null,
      fecha_publicacion_articulo: articlePublishedAt,
      fecha_publicacion_fuente: feedPublishedAt,
      fecha_publicacion_verificada: Boolean(publishedAt),
      article_complete: body.length >= 300,
      article_fetch_status: fetchStatus,
      article_fetch_error: body ? null : (fetchStatus === 'body_too_short' ? 'El texto extraído no alcanza 300 caracteres' : 'La página respondió, pero no se encontró el cuerpo del artículo'),
      fuente_host: sourceKey(canonicalUrl),
    };
  } catch (error) {
    const message = String(error.message || 'unknown_error');
    const httpCode = Number((message.match(/^HTTP (\d+)/) || [])[1] || 0);
    const status = [401, 403, 429].includes(httpCode) ? 'blocked' : httpCode >= 500 ? 'source_server_error' : httpCode ? 'http_error' : /Timeout/i.test(message) ? 'timeout' : 'fetch_error';
    return {
      ...item,
      article_body: '',
      article_complete: false,
      article_chars: 0,
      article_fetch_status: status,
      article_fetch_error: message,
      fecha_publicacion_verificada: Boolean(item.timestamp && !Number.isNaN(Date.parse(item.timestamp))),
      timestamp: item.timestamp && !Number.isNaN(Date.parse(item.timestamp)) ? new Date(item.timestamp).toISOString() : null,
    };
  }
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
    const sourceTag = (block.match(/<source\b([^>]*)>([\s\S]*?)<\/source>/i) || []);
    const sourceAttrs = sourceTag[1] || '';
    const sourceName = decodeXml(sourceTag[2] || '');
    const sourceUrlMatch = sourceAttrs.match(/\burl=["']([^"']+)["']/i);
    const sourceUrl = sourceUrlMatch ? sourceUrlMatch[1] : null;
    const validDate = Boolean(pubDate && !Number.isNaN(Date.parse(pubDate)));
    if (!title || !link) continue;
    const ts = validDate ? new Date(pubDate).toISOString() : null;
    items.push({ title, description: description.slice(0, 500), link, pubDate: validDate ? pubDate : null, timestamp: ts, fecha_publicacion_verificada: validDate, fuente_original: sourceName || null, fuente_url_original: sourceUrl });
  }
  return items;
}

function sourceKey(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch (_) { return 'fuente-desconocida'; }
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


function replaceEnrichedArticle(collection, original, enriched) {
  const index = collection.indexOf(original);
  if (index < 0) return false;
  collection[index] = enriched;
  return true;
}

async function main() {
  console.log('📰 REAL FOOTBALL NEWSROOM v5 — ingesta de fuentes reales');
  const cache = loadCache();
  const previous = Array.isArray(cache.noticias) ? cache.noticias : [];
  const fresh = [];

  // Descubrimiento directo desde la portada oficial de TNT Sports Chile.
  try {
    const homepage = await httpGetResponse('https://www.tntsports.cl/');
    const directStories = parseTntHomepage(homepage.body);
    for (const item of directStories) {
      if (fresh.some(n => n.link === item.link || similitud(n.title, item.title) >= 0.65)) continue;
      const cachedMatch = previous.find(n => similitud(n.title, item.title) >= 0.65);
      if (cachedMatch?.article_complete === true) continue;
      const viral = calcularViralScore({ ...item, categoria: item.categoria_feed });
      fresh.push({ ...item, categoria: viral.categoria, equipo_chile: viral.equipoChile, viral_score: viral.score, razones: viral.razones });
    }
    console.log(`📺 TNT Sports portada: ${directStories.length} noticia(s) detectada(s)`);
  } catch (error) {
    console.log(`  ⚠️ TNT Sports portada: ${error.message}`);
  }

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`📡 ${feed.name}`);
      const xml = await httpGet(feed.url);
      const parsed = parseFeed(xml)
        .filter(esFutbol)
        .slice(0, 12)
        .map(item => ({
          ...item,
          fuente: item.fuente_original || feed.name,
          fuente_host: sourceKey(item.fuente_url_original || item.link),
          categoria_feed: feed.categoria,
          prioridad_fuente: feed.prioridad || 0,
          nivel_fuente: feed.nivel_fuente || 3,
        }));

      for (const item of parsed) {
        if (fresh.some(n => similitud(n.title, item.title) >= 0.65)) continue;
        const cachedMatch = previous.find(n => similitud(n.title, item.title) >= 0.65);
        if (cachedMatch?.article_complete === true) continue;
        // Si la noticia previa solo tenía un snippet RSS, volver a intentar recuperar el artículo completo.
        const viral = calcularViralScore({ ...item, categoria: item.categoria_feed });
        fresh.push({ ...item, categoria: viral.categoria, equipo_chile: viral.equipoChile, viral_score: viral.score, razones: viral.razones });
      }
    } catch (err) {
      console.log(`  ⚠️ ${err.message}`);
    }
  }

  // El RSS descubre titulares; recuperar el artículo original antes de redactar.
  const sortedFresh = fresh.slice().sort((a, b) => (b.prioridad_fuente || 0) - (a.prioridad_fuente || 0) || (b.viral_score || 0) - (a.viral_score || 0));
  const perHostCount = {};
  const toEnrich = [];
  for (const item of sortedFresh) {
    const host = item.fuente_host || item.fuente || 'other';
    if ((perHostCount[host] || 0) >= 6) continue;
    perHostCount[host] = (perHostCount[host] || 0) + 1;
    toEnrich.push(item);
    if (toEnrich.length >= 42) break;
  }
  for (let i = 0; i < toEnrich.length; i += 3) {
    const batch = toEnrich.slice(i, i + 3);
    // La fecha del artículo puede diferir de la fecha RSS y la URL puede canonicalizarse.
    // Conservar la referencia al objeto original evita perder la versión enriquecida.
    const enriched = await Promise.all(batch.map(async original => ({
      original,
      article: await enrichArticle(original),
    })));
    for (const result of enriched) {
      replaceEnrichedArticle(fresh, result.original, result.article);
      const article = result.article;
      console.log(article.article_complete ? `  ✓ Artículo completo: ${article.article_title}` : `  ⚠️ ${article.article_fetch_status || 'extraction_error'}: ${article.title} (${article.article_fetch_error || 'sin detalle'})`);
    }
  }

  // Mantener solo información reciente. 72h es el respaldo para fines de semana.
  const now = Date.now();
  const recientes = [...fresh, ...previous]
    .filter(n => {
      if (n.fecha_publicacion_verificada !== true || !n.timestamp) return false;
      const published = Date.parse(n.timestamp);
      if (!Number.isFinite(published)) return false;
      const ageH = (now - published) / 36e5;
      return ageH <= 72 && ageH >= -6;
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

if (require.main === module) {
  main().catch(err => {
    console.error(`❌ fetch-real-news: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { httpGet, httpGetResponse, httpPostForm, resolveGoogleNewsBatchExecute, extractGoogleNewsTarget, expectedSourceHosts, decodeXml, decodeHtml, plainText, extractArticle, parseTntHomepage, enrichArticle, replaceEnrichedArticle, getTag, parseFeed, esFutbol, similitud, sourceKey };
