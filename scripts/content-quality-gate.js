'use strict';

const MOJIBAKE = /(?:Ã[\u0080-\u00BF]|Â[\u0080-\u00BF]|â€|ï¿½|\uFFFD|\\uFFFD)/i;
const HTML_TAG = /<\/?[a-z][^>]*>/i;
const PLACEHOLDER = /\b(?:undefined|null|NaN|TODO|PLACEHOLDER)\b/i;
const GENERIC_TEAM = /^(?:f[uú]tbol chileno|f[uú]tbol mundial|chile|noticias|equipo local|equipo visitante|por definir)$/i;

function validateItemForRender(item, index = 1) {
  const fail = (message) => { throw new Error('CONTENT_GATE_BLOCKED: pieza ' + index + ': ' + message); };
  if (!item || typeof item !== 'object' || Array.isArray(item)) fail('pieza no válida');
  for (const key of ['gancho', 'titulo_youtube', 'descripcion_youtube', '_fuente', '_fuente_url']) {
    if (typeof item[key] !== 'string' || !item[key].trim()) fail('falta el campo ' + key);
    if (MOJIBAKE.test(item[key])) fail('caracteres dañados en ' + key);
    if (HTML_TAG.test(item[key])) fail('etiquetas HTML visibles en ' + key);
    if (PLACEHOLDER.test(item[key])) fail('marcador técnico visible en ' + key);
  }
  // These fields are painted into the video, not only stored in YouTube metadata.
  const visibleText = [
    item.gancho, item.subtitulo, item.descripcion, item.narracion,
    item.equipo1, item.equipo2, ...(Array.isArray(item.puntos) ? item.puntos : []),
  ].filter((value) => value !== undefined && value !== null).map(String);
  for (const value of visibleText) {
    if (MOJIBAKE.test(value)) fail('caracteres dañados en texto visible del video');
    if (HTML_TAG.test(value) || HTML_ENTITY.test(value)) fail('etiquetas o entidades HTML sin limpiar en texto visible');
    if (PLACEHOLDER.test(value)) fail('marcador técnico visible en texto del video');
  }
  if (item.titulo_youtube.length > 100) fail('título supera 100 caracteres');
  if (!Array.isArray(item.puntos) || item.puntos.length < 2 || item.puntos.some((p) => typeof p !== 'string' || p.trim().length < 8)) {
    fail('faltan puntos de contenido legibles');
  }
  if (!/^https?:\/\/\S+/i.test(item._fuente_url)) fail('URL de fuente inválida');

  const isMatch = item._tipo_contenido === 'narrativa'
    || item._match_id !== null && item._match_id !== undefined
    || item._goles_local !== undefined && item._goles_visita !== undefined;
  if (isMatch) {
    if (typeof item.equipo1 !== 'string' || !item.equipo1.trim()
      || typeof item.equipo2 !== 'string' || !item.equipo2.trim()
      || GENERIC_TEAM.test(item.equipo1.trim()) || GENERIC_TEAM.test(item.equipo2.trim())) {
      fail('partido sin nombres concretos de ambos equipos; no se publicará con rivales incompletos');
    }
  }
  return { ok: true };
}

module.exports = { validateItemForRender };
