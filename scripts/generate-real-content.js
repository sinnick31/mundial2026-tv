/**
 * generate-real-content.js — REAL FOOTBALL NEWSROOM v6
 *
 * La IA no inventa hechos: todas las piezas nacen de una fuente real,
 * URL verificable y fecha de publicación. El cambio v6 añade una capa
 * editorial original para que cada video aporte contexto y una lectura
 * del canal, en lugar de limitarse a leer un titular.
 */

const fs = require('fs');
const { loadHistory, saveHistory, hasSimilarHook, registrar } = require('./content-history');

const MAX_ITEMS = Math.min(parseInt(process.env.MAX_ITEMS || '2', 10), 2);
const MODO = process.env.MODO || 'auto';
const FECHA = new Date().toISOString().split('T')[0];

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return fallback; }
}
function clean(s = '') {
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
function normalize(s = '') {
  return clean(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function ageHours(item) {
  const ts = new Date(item.timestamp || Date.now()).getTime();
  return Math.max(0, (Date.now() - ts) / 36e5);
}
function isColo(item) {
  const t = normalize(`${item.title} ${item.description} ${item.equipo_chile || ''}`);
  return ['colo colo', 'colocolo', 'cacique', 'albos'].some(k => t.includes(k));
}
function isChileCompetition(item) {
  const t = normalize(`${item.title} ${item.description}`);
  return [
    'liga de primera', 'primera division', 'campeonato nacional', 'liga de ascenso',
    'primera b', 'segunda division', 'liga 2d', 'copa chile', 'copa de la liga',
    'supercopa de chile', 'liga femenina', 'ascenso femenino', 'tercera a', 'tercera b',
    'futbol formativo', 'futsal', 'anfp', 'anfa',
  ].some(k => t.includes(k));
}
function isChileanAbroad(item) {
  if (item.categoria === 'chilenos_exterior') return true;
  const t = normalize(`${item.title} ${item.description}`);
  return [
    'futbolista chileno', 'futbolistas chilenos', 'jugador chileno', 'jugadores chilenos',
    'chileno en el extranjero', 'chilenos en el extranjero', 'alexis sanchez', 'ben brereton',
    'dario osorio', 'marcelino nunez', 'gabriel suazo', 'guillermo maripan',
    'victor davila', 'lucas assadi', 'lucas cepeda', 'alexander aravena',
    'felipe mora', 'maximiliano falcon',
  ].some(k => t.includes(k));
}
function importance(item) {
  let score = Number(item.viral_score || 0);
  if (isColo(item)) score += 100;
  if (isChileCompetition(item)) score += 50;
  if (isChileanAbroad(item)) score += 45;
  score += Math.max(0, 48 - ageHours(item)) / 4;
  score += Number(item.prioridad_fuente || 0) / 2;
  return score;
}
function snippet(item) {
  const desc = clean(item.description || '');
  if (desc.length >= 70) return desc.slice(0, 220).replace(/\s+\S*$/, '') + '.';
  return clean(item.title).slice(0, 180);
}
function typeFor(item) {
  if (isColo(item)) return 'colo_colo';
  if (isChileanAbroad(item)) return 'chilenos_exterior';
  return 'chile';
}
function editorialAngle(type) {
  if (type === 'colo_colo') return 'Por qué esta noticia importa ahora para Colo-Colo y qué conviene seguir en las próximas horas.';
  if (type === 'chilenos_exterior') return 'Qué cambia para el futbolista chileno involucrado y qué habrá que mirar en su próximo partido o decisión.';
  return 'Qué significa esta noticia dentro de la competencia chilena y cuál es el siguiente dato que puede cambiar el escenario.';
}
function closingQuestion(type) {
  if (type === 'colo_colo') return 'La pregunta queda abierta: ¿qué debería ser lo siguiente que mire el hincha albo?';
  if (type === 'chilenos_exterior') return 'Ahora queda seguir su próximo partido y comprobar si esta tendencia se sostiene.';
  return 'La próxima fecha puede entregar la pista clave para confirmar si esta noticia realmente mueve el campeonato.';
}
function labelFor(type) {
  return type === 'colo_colo' ? 'COLO-COLO' : type === 'chilenos_exterior' ? 'CHILENOS POR EL MUNDO' : 'FÚTBOL CHILENO';
}
function titleFor(item, type) {
  const base = clean(item.title).replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim();
  const label = labelFor(type);
  const suffix = type === 'colo_colo' ? ' | Lo que se sabe' : type === 'chilenos_exterior' ? ' | La clave para seguirlo' : ' | Lo que cambia';
  const room = Math.max(20, 100 - label.length - suffix.length - 4);
  const short = base.length > room ? `${base.slice(0, room - 1).replace(/\s+\S*$/, '')}…` : base;
  return `${label}: ${short}${suffix}`.slice(0, 100);
}
function buildNarration(item, type, resumen) {
  const title = clean(item.title);
  const sourceName = clean(item.fuente || item.fuente_host || 'la fuente original');
  return [
    `${labelFor(type)}. ${title}.`,
    `El dato confirmado por ${sourceName} es el siguiente: ${resumen}`,
    editorialAngle(type),
    closingQuestion(type),
  ].join(' ');
}
function buildItem(item, type, order) {
  const title = clean(item.title);
  const resumen = snippet(item);
  const fuente = item.fuente || item.fuente_host || 'Fuente deportiva';
  const fuenteUrl = item.link;
  const angle = editorialAngle(type);
  const tags = [
    'FutbolChileno',
    type === 'chilenos_exterior' ? 'ChilenosPorElMundo' : type === 'colo_colo' ? 'ColoColo' : 'CampeonatoChileno',
    'Chile', 'Futbol', 'Shorts',
  ];
  return {
    tipo: 'sorpresa',
    gancho: `${labelFor(type)}: ${clean(title).slice(0, 80)}`,
    subtitulo: angle,
    descripcion: `${resumen} ${angle}`,
    equipo1: item.equipo_chile || (type === 'chilenos_exterior' ? 'Chile' : 'Fútbol chileno'),
    equipo2: null,
    probabilidad: 0,
    puntos: [
      `Hecho confirmado: ${title}`,
      `Contexto: ${resumen}`,
      `Lectura editorial: ${angle}`,
      `Cierre: ${closingQuestion(type)}`,
    ],
    narracion: buildNarration(item, type, resumen),
    emoji: type === 'colo_colo' ? '⚪⚫' : type === 'chilenos_exterior' ? '🇨🇱🌎' : '🇨🇱⚽',
    titulo_youtube: titleFor(item, type),
    descripcion_youtube: [
      `Esta edición de ${labelFor(type).toLowerCase()} parte de un hecho publicado y añade contexto editorial propio.`,
      `Hecho: ${title}`,
      `Lectura del canal: ${angle}`,
      `Fuente original: ${fuente} — ${fuenteUrl}`,
      `Fecha de la fuente: ${item.pubDate || item.timestamp || FECHA}`,
      '#FutbolChileno #Chile #Futbol #Shorts',
    ].join('\n\n'),
    tags,
    _tipo_contenido: 'noticia',
    _match_id: null,
    _noticia_original: title,
    _fuente: fuente,
    _fuente_url: fuenteUrl,
    _fecha: FECHA,
    _orden: order,
    _categoria_editorial: type,
  };
}

function main() {
  const news = readJson('news-cache.json', { noticias: [] });
  const history = loadHistory();
  const candidates = Array.isArray(news.noticias)
    ? news.noticias.filter(n => ageHours(n) <= 72 && n.link)
    : [];

  if (!candidates.length) {
    fs.writeFileSync('daily-content.json', JSON.stringify({ fecha: FECHA, total: 0, contenido: [] }, null, 2));
    console.log('⚠️ No hay fuentes recientes con URL verificable. No se publica relleno.');
    return;
  }

  const usedLinks = new Set();
  const picks = [];
  const addPick = (predicate, type) => {
    if (picks.length >= MAX_ITEMS) return;
    const item = candidates
      .filter(predicate)
      .filter(n => !usedLinks.has(n.link))
      .filter(n => !hasSimilarHook(history, n.title, 'noticia'))
      .sort((a, b) => importance(b) - importance(a))[0];
    if (!item) return;
    usedLinks.add(item.link);
    picks.push(buildItem(item, type, picks.length + 1));
  };

  if (MODO === 'auto' || MODO === 'chile' || MODO === 'noticias') addPick(isColo, 'colo_colo');
  if (picks.length < MAX_ITEMS && (MODO === 'auto' || MODO === 'chile' || MODO === 'noticias')) addPick(isChileCompetition, 'chile');
  if (picks.length < MAX_ITEMS && (MODO === 'auto' || MODO === 'noticias')) addPick(isChileanAbroad, 'chilenos_exterior');

  if (picks.length < MAX_ITEMS) {
    candidates
      .filter(n => !usedLinks.has(n.link))
      .filter(n => !hasSimilarHook(history, n.title, 'noticia'))
      .sort((a, b) => importance(b) - importance(a))
      .slice(0, MAX_ITEMS - picks.length)
      .forEach(n => {
        if (picks.length >= MAX_ITEMS) return;
        usedLinks.add(n.link);
        picks.push(buildItem(n, typeFor(n), picks.length + 1));
      });
  }

  if (!picks.length) {
    fs.writeFileSync('daily-content.json', JSON.stringify({ fecha: FECHA, total: 0, contenido: [] }, null, 2));
    console.log('⚠️ No hay una pieza nueva y suficientemente distinta. No se publica.');
    return;
  }

  picks.forEach(item => registrar(history, {
    matchId: null,
    tipoContenido: 'noticia',
    hook: item.gancho,
    titulo: item.titulo_youtube,
  }));
  saveHistory(history);

  fs.writeFileSync('daily-content.json', JSON.stringify({
    fecha: FECHA,
    generado_en: new Date().toISOString(),
    total: picks.length,
    modo: MODO,
    politica: 'SOURCE_LOCKED_EDITORIAL_V6',
    contenido: picks,
  }, null, 2));

  console.log(`✅ ${picks.length} piezas reales seleccionadas`);
  picks.forEach((p, i) => console.log(`${i + 1}. [${p._fuente}] ${p.titulo_youtube}`));
}
main();
