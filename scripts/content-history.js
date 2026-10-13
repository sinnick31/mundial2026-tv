/**
 * content-history.js
 * Lleva registro de TODO lo publicado para que el pipeline jamás repita
 * el mismo partido, la misma predicción o el mismo ranking dos veces.
 *
 * El archivo content-history.json vive en la raíz del repo y se commitea
 * automáticamente al final de cada ejecución exitosa (ver workflow).
 */

const fs = require('fs');
const path = require('path');

const HISTORY_PATH = path.join(process.cwd(), 'content-history.json');
const MAX_HISTORY_ITEMS = 500; // evita que el archivo crezca infinito

function loadHistory() {
  if (!fs.existsSync(HISTORY_PATH)) {
    return { items: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
  } catch {
    return { items: [] };
  }
}

function saveHistory(history) {
  // Recorta para no crecer infinito — se queda con lo más reciente
  if (history.items.length > MAX_HISTORY_ITEMS) {
    history.items = history.items.slice(-MAX_HISTORY_ITEMS);
  }
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
}

/**
 * Normaliza texto para comparar (sin tildes, minúsculas, sin espacios extra)
 */
function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * ¿Ya publicamos algo sobre este partido específico?
 */
function hasMatch(history, matchId) {
  return history.items.some(i => i.match_id === String(matchId));
}

/**
 * ¿Ya publicamos un gancho/tema muy similar? (anti-clones de ranking/noticia)
 * Compara por similitud simple de palabras clave, no exacta.
 */
function hasSimilarHook(history, hook, tipoContenido, diasVentana = 14) {
  const normHook = normalize(hook);
  const limite = Date.now() - diasVentana * 24 * 60 * 60 * 1000;

  return history.items.some(i => {
    if (i.tipo_contenido !== tipoContenido) return false;
    if (new Date(i.fecha).getTime() < limite) return false;
    const normPrev = normalize(i.hook || '');
    if (!normPrev) return false;
    // Similitud por palabras compartidas (Jaccard simple)
    const a = new Set(normHook.split(' '));
    const b = new Set(normPrev.split(' '));
    const interseccion = [...a].filter(x => b.has(x)).length;
    const union = new Set([...a, ...b]).size;
    const similitud = union === 0 ? 0 : interseccion / union;
    return similitud > 0.6; // 60%+ de palabras en común = duplicado
  });
}

function normalizeSourceUrl(value) {
  try {
    const u = new URL(String(value));
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|ref$)/i.test(key)) u.searchParams.delete(key);
    }
    return u.toString().replace(/\/$/, '');
  } catch {
    return String(value || '').trim();
  }
}

/** Detecta una fuente ya publicada, aunque cambie el gancho o el título de YouTube. */
function titleTokens(value) {
  const stop = new Set(['para', 'como', 'donde', 'cuando', 'desde', 'hasta', 'sobre', 'tras', 'ante', 'entre', 'este', 'esta', 'estos', 'estas', 'futbol', 'mundial', 'noticia', 'oficial', 'horario', 'tv', 'ver', 'por', 'con', 'del', 'las', 'los', 'una', 'uno', 'que', 'sus', 'mas']);
  return new Set(normalize(value).split(' ').filter(word => word.length > 3 && !stop.has(word)));
}

function hasSeenSource(history, sourceUrl, title, diasVentana = 30) {
  const url = normalizeSourceUrl(sourceUrl);
  const tokens = titleTokens(title || '');
  const limite = Date.now() - diasVentana * 24 * 60 * 60 * 1000;

  return history.items.some(i => {
    const fecha = new Date(i.fecha || 0).getTime();
    if (!Number.isFinite(fecha) || fecha < limite) return false;
    const previousUrl = normalizeSourceUrl(i.source_url || i.fuente_url || '');
    if (url && previousUrl && url === previousUrl) return true;

    // Compatibilidad con historial antiguo: compara el titular original con el título publicado.
    const previousTokens = titleTokens(i.titulo || '');
    if (tokens.size < 3 || previousTokens.size < 3) return false;
    const shared = [...tokens].filter(token => previousTokens.has(token)).length;
    return shared / Math.min(tokens.size, previousTokens.size) >= 0.8;
  });
}

function registrar(history, { matchId, tipoContenido, hook, titulo, sourceUrl }) {
  history.items.push({
    match_id: matchId ? String(matchId) : null,
    tipo_contenido: tipoContenido,
    hook,
    titulo,
    source_url: sourceUrl ? normalizeSourceUrl(sourceUrl) : null,
    fecha: new Date().toISOString(),
  });
}

module.exports = {
  loadHistory,
  saveHistory,
  hasMatch,
  hasSimilarHook,
  hasSeenSource,
  registrar,
  normalize,
};
