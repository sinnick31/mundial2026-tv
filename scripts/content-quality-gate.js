'use strict';

const MOJIBAKE = /(?:Ã[\u0080-\u00FF]|Â[\u0080-\u00FF]|â€|ï¿½|�|\\uFFFD)/i;
const HTML_TAG = /<\/?[a-z][^>]*>/i;
const HTML_ENTITY = /&(?:#\d+|#x[\da-f]+|[a-z][a-z0-9]+);/i;
const PLACEHOLDER = /\b(?:undefined|null|NaN|TODO|PLACEHOLDER)\b/i;
const GENERIC_TEAM = /^(?:f[uú]tbol chileno|f[uú]tbol mundial|chile|noticias|equipo local|equipo visitante|por definir)$/i;

function validateItemForRender(item, index = 1) {
  const fail = (message) => { throw new Error('CONTENT_GATE_BLOCKED: pieza ' + index + ': ' + message); };
  if (!item || typeof item !== 'object' || Array.isArray(item)) fail('pieza no válida');

  const textFields = [
    'gancho', 'subtitulo', 'descripcion', 'narracion', 'titulo_youtube',
    'descripcion_youtube', '_noticia_original', '_fuente',
  ];
  for (const key of textFields) {
    const value = item[key];
    if (value === undefined || value === null || value === '') {
      if (['subtitulo', 'descripcion'].includes(key)) continue;
      fail('falta el campo ' + key);
    }
    if (typeof value !== 'string') fail('campo de texto inválido: ' + key);
    if (MOJIBAKE.test(value)) fail('caracteres dañados en ' + key);
    if (HTML_TAG.test(value)) fail('etiquetas HTML sin limpiar en ' + key);
    if (HTML_ENTITY.test(value)) fail('entidades HTML sin decodificar en ' + key);
    if (PLACEHOLDER.test(value)) fail('marcador técnico visible en ' + key);
  }
  if (typeof item._fuente_url !== 'string' || !/^https?:\/\/[^\s]+$/i.test(item._fuente_url)
      || HTML_ENTITY.test(item._fuente_url)) fail('URL de fuente inválida o sin limpiar');

  const visibleText = [
    item.equipo1, item.equipo2,
    ...(Array.isArray(item.puntos) ? item.puntos : []),
  ].filter((value) => value !== undefined && value !== null).map(String);
  for (const value of visibleText) {
    if (MOJIBAKE.test(value)) fail('caracteres dañados en texto visible del video');
    if (HTML_TAG.test(value)) fail('etiquetas HTML sin limpiar en texto visible');
    if (HTML_ENTITY.test(value)) fail('entidades HTML sin decodificar en texto visible');
    if (PLACEHOLDER.test(value)) fail('marcador técnico visible en texto del video');
  }
  if (item.titulo_youtube.length < 12 || item.titulo_youtube.length > 100) fail('título debe tener entre 12 y 100 caracteres');
  if (typeof item.narracion !== 'string' || item.narracion.trim().length < 180) fail('narración insuficiente; mínimo 180 caracteres');
  if (!Array.isArray(item.puntos) || item.puntos.length < 2 || item.puntos.some((p) => typeof p !== 'string' || p.trim().length < 8)) {
    fail('faltan puntos de contenido legibles');
  }

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
