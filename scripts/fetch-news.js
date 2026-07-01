/**
 * fetch-news.js — Buscador de noticias del Mundial 2026
 * 
 * Scrapea RSS feeds y sitios deportivos para obtener noticias reales
 * del Mundial 2026 y las guarda en news-cache.json para que
 * generate-daily-content.js las use como base del contenido.
 * 
 * Fuentes: Google News RSS, ESPN, AS.com, Marca, Infobae Deportes
 */

const fs = require('fs');
const https = require('https');

// ─── Palabras clave para filtrar noticias del Mundial ────────────────────────
const KEYWORDS = [
  'mundial 2026', 'world cup 2026', 'fifa 2026', 'copa del mundo 2026',
  'mundial estados unidos', 'world cup usa', 'fifa world cup',
  'seleccion', 'gol', 'partido', 'eliminado', 'clasificado', 'fase de grupos',
  'octavos', 'cuartos', 'semifinal', 'final', 'penales', 'arbitro',
  'ronaldo', 'messi', 'mbappe', 'vinicius', 'haaland', 'bellingham',
  'argentina', 'brasil', 'españa', 'francia', 'alemania', 'portugal',
  'marruecos', 'japon', 'mexico', 'estados unidos', 'colombia', 'chile',
  'uruguay', 'ecuador', 'peru', 'venezuela', 'canada', 'senegal'
];

// ─── RSS Feeds deportivos que cubren el Mundial ───────────────────────────────
const RSS_FEEDS = [
  {
    name: 'Google News - Mundial 2026',
    url: 'https://news.google.com/rss/search?q=mundial+2026+futbol&hl=es&gl=US&ceid=US:es',
    lang: 'es'
  },
  {
    name: 'Google News - World Cup 2026',
    url: 'https://news.google.com/rss/search?q=world+cup+2026+soccer&hl=en&gl=US&ceid=US:en',
    lang: 'en'
  },
  {
    name: 'Google News - FIFA 2026',
    url: 'https://news.google.com/rss/search?q=FIFA+World+Cup+2026&hl=es&gl=ES&ceid=ES:es',
    lang: 'es'
  },
  {
    name: 'ESPN Deportes RSS',
    url: 'https://espndeportes.espn.com/rss/noticias',
    lang: 'es'
  }
];

// ─── Función para hacer HTTP GET simple ──────────────────────────────────────
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : require('http');
    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Mundial2026Bot/1.0; +https://github.com/sinnick31/mundial2026-tv)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      timeout: 10000
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpGet(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ─── Parser de RSS básico sin dependencias externas ──────────────────────────
function parseRSS(xmlString) {
  const items = [];
  const itemRegex = /<item>([sS]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xmlString)) !== null) {
    const itemContent = match[1];
    const title = (itemContent.match(/<title[^>]*>(?:<![CDATA[)?([sS]*?)(?:]]>)?<\/title>/) || [])[1] || '';
    const desc = (itemContent.match(/<description[^>]*>(?:<![CDATA[)?([sS]*?)(?:]]>)?<\/description>/) || [])[1] || '';
    const link = (itemContent.match(/<link>([sS]*?)<\/link>/) || [])[1] || '';
    const pubDate = (itemContent.match(/<pubDate>([sS]*?)<\/pubDate>/) || [])[1] || '';
    
    const cleanTitle = title.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    const cleanDesc = desc.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim().substring(0, 300);
    
    if (cleanTitle) {
      items.push({
        title: cleanTitle,
        description: cleanDesc,
        link: link.trim(),
        pubDate: pubDate.trim(),
        timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()
      });
    }
  }
  return items;
}

// ─── Verificar si una noticia es relevante para el Mundial ───────────────────
function esNoticiaMundial(noticia) {
  const texto = (noticia.title + ' ' + noticia.description).toLowerCase();
  return KEYWORDS.some(kw => texto.includes(kw.toLowerCase()));
}

// ─── Cargar caché existente ───────────────────────────────────────────────────
function loadCache() {
  try {
    if (fs.existsSync('news-cache.json')) {
      return JSON.parse(fs.readFileSync('news-cache.json', 'utf8'));
    }
  } catch (e) {}
  return { noticias: [], ultima_actualizacion: null };
}

// ─── Guardar caché ────────────────────────────────────────────────────────────
function saveCache(cache) {
  fs.writeFileSync('news-cache.json', JSON.stringify(cache, null, 2));
}

// ─── Pipeline principal ───────────────────────────────────────────────────────
async function fetchNews() {
  console.log('🔍 Buscando noticias del Mundial 2026 en internet...\n');
  
  const cache = loadCache();
  const titulosExistentes = new Set(cache.noticias.map(n => n.title));
  const noticiasNuevas = [];
  
  for (const feed of RSS_FEEDS) {
    console.log(`📡 Consultando: ${feed.name}...`);
    try {
      const xml = await httpGet(feed.url);
      const items = parseRSS(xml);
      
      const relevantes = items
        .filter(item => esNoticiaMundial(item))
        .filter(item => !titulosExistentes.has(item.title))
        .slice(0, 10);
      
      relevantes.forEach(item => {
        item.fuente = feed.name;
        item.idioma = feed.lang;
        noticiasNuevas.push(item);
        titulosExistentes.add(item.title);
      });
      
      console.log(`  ✅ ${relevantes.length} noticias nuevas del Mundial encontradas`);
    } catch (err) {
      console.log(`  ⚠️ Error en ${feed.name}: ${err.message}`);
    }
    
    // Pausa entre requests
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Combinar con caché (mantener solo últimas 50 noticias)
  const todasLasNoticias = [...noticiasNuevas, ...cache.noticias]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 50);
  
  const cacheActualizado = {
    noticias: todasLasNoticias,
    ultima_actualizacion: new Date().toISOString(),
    total_hoy: noticiasNuevas.length
  };
  
  saveCache(cacheActualizado);
  
  console.log(`\n✅ Total noticias en caché: ${todasLasNoticias.length}`);
  console.log(`📰 Nuevas noticias hoy: ${noticiasNuevas.length}`);
  
  if (noticiasNuevas.length > 0) {
    console.log('\n🔥 Últimas noticias del Mundial:');
    noticiasNuevas.slice(0, 5).forEach((n, i) => {
      console.log(`  ${i + 1}. ${n.title}`);
    });
  }
}

fetchNews().catch(err => {
  console.error('❌ Error en fetch-news:', err.message);
  // No falla el pipeline — si no hay noticias, el generador usa solo los partidos
  process.exit(0);
});
