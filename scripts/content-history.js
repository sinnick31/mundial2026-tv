/**
 * content-history.js
 * Lleva registro de TODO lo publicado para que el pipeline jamas repita
 * el mismo partido, la misma prediccion o el mismo ranking dos veces.
 *
 * Tambien guarda el video_id real de YouTube de cada publicacion (cuando
 * se conoce, despues del upload) para poder cruzarlo mas tarde con datos
 * reales de YouTube Analytics en fetch-youtube-analytics.js.
 *
 * El archivo content-history.json vive en la raiz del repo y se commitea
 * automaticamente al final de cada ejecucion exitosa (ver workflow).
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
  if (history.items.length > MAX_HISTORY_ITEMS) {
    history.items = history.items.slice(-MAX_HISTORY_ITEMS);
  }
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
}

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasMatch(history, matchId) {
  return history.items.some(i => i.match_id === String(matchId));
}

function hasSimilarHook(history, hook, tipoContenido, diasVentana = 14) {
  const normHook = normalize(hook);
  const limite = Date.now() - diasVentana * 24 * 60 * 60 * 1000;

  return history.items.some(i => {
    if (i.tipo_contenido !== tipoContenido) return false;
    if (new Date(i.fecha).getTime() < limite) return false;
    const normPrev = normalize(i.hook || '');
    if (!normPrev) return false;
    const a = new Set(normHook.split(' '));
    const b = new Set(normPrev.split(' '));
    const interseccion = [...a].filter(x => b.has(x)).length;
    const union = new Set([...a, ...b]).size;
    const similitud = union === 0 ? 0 : interseccion / union;
    return similitud > 0.6;
  });
}

function registrar(history, { matchId, tipoContenido, hook, titulo }) {
  history.items.push({
    match_id: matchId ? String(matchId) : null,
    tipo_contenido: tipoContenido,
    hook,
    titulo,
    fecha: new Date().toISOString(),
    video_id: null,
  });
}

function vincularVideoId(history, hook, videoId) {
  if (!videoId) return false;
  for (let i = history.items.length - 1; i >= 0; i--) {
    const item = history.items[i];
    if (item.hook === hook && !item.video_id) {
      item.video_id = videoId;
      return true;
    }
  }
  return false;
}

module.exports = {
  loadHistory,
  saveHistory,
  hasMatch,
  hasSimilarHook,
  registrar,
  vincularVideoId,
  normalize,
};
