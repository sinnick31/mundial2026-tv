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
  return String(s).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
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
  return ['liga de primera', 'primera division', 'campeonato nacional', 'liga de ascenso', 'primera b', 'segunda division', 'liga 2d', 'copa chile', 'copa de la liga', 'supercopa de chile', 'liga femenina', 'ascenso femenino', 'tercera a', 'tercera b', 'futbol formativo', 'futsal', 'anfp', 'anfa'].some(k => t.includes(k));
}
function isInternational(item) {
  if (item.categoria === 'internacional') return true;
  const t = normalize(String(item.title || '') + ' ' + String(item.description || ''));
  return ['champions league', 'premier league', 'laliga', 'la liga', 'serie a', 'bundesliga', 'ligue 1', 'brasileirao', 'liga mx', 'mls', 'copa libertadores', 'copa sudamericana', 'fifa', 'uefa', 'conmebol', 'mundial de clubes', 'futbol argentino'].some(k => t.includes(k));
}
function isChileanAbroad(item) {
  if (item.categoria === 'chilenos_exterior') return true;
  const t = normalize(`${item.title} ${item.description}`);
  return ['futbolista chileno', 'futbolistas chilenos', 'jugador chileno', 'jugadores chilenos', 'chileno en el extranjero', 'chilenos en el extranjero', 'alexis sanchez', 'ben brereton', 'dario osorio', 'marcelino nunez', 'gabriel suazo', 'guillermo maripan', 'victor davila', 'lucas assadi', 'lucas cepeda', 'alexander aravena', 'felipe mora', 'maximiliano falcon'].some(k => t.includes(k));
}
function importance(item) {
  let score = Number(item.viral_score || 0);
  if (isColo(item)) score += 28;
  if (isChileCompetition(item)) score += 55;
  if (item.categoria === 'internacional') score += 24;
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
  if (isInternational(item)) return 'internacional';
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
function ganchoFor(item, type) {
  const title = clean(item.title).replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim();
  const clipped = title.length > 74 ? title.slice(0, 71).replace(/\s+\S*$/, '') + '…' : title;
  if (type === 'colo_colo') return ('OJO, HINCHA ALBO: ' + clipped).slice(0, 100);
  if (type === 'chilenos_exterior') return ('CHILENOS POR EL MUNDO: ' + clipped).slice(0, 100);
  if (type === 'internacional') return ('FÚTBOL MUNDIAL: ' + clipped).slice(0, 100);
  return ('ATENCIÓN, FÚTBOL CHILENO: ' + clipped).slice(0, 100);
}
function titleFor(item, type) {
  const base = clean(item.title).replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim();
  const label = labelFor(type);
  const suffix = type === 'colo_colo' ? ' | Lo que se sabe' : type === 'chilenos_exterior' ? ' | La clave para seguirlo' : ' | Lo que cambia';
  const room = Math.max(20, 100 - label.length - suffix.length - 4);
  const short = base.length > room ? `${base.slice(0, room - 1).replace(/\s+\S*$/, '')}…` : base;
  return `${label}: ${short}${suffix}`.slice(0, 100);
}
function fechaPublicacion(item) {
  const raw = item.pubDate || item.timestamp;
  if (!raw || Number.isNaN(Date.parse(raw))) return null;
  return new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(raw));
}
function buildNarration(item, type, resumen) {
  const title = clean(item.title);
  const sourceName = clean(item.fuente || item.fuente_host || 'la fuente original');
  const fecha = fechaPublicacion(item);
  const fechaTexto = fecha ? `La publicación de ${sourceName} está fechada el ${fecha}. Esta es la fecha de publicación de la fuente, no necesariamente la fecha del partido.` : 'La fecha de publicación no pudo verificarse con los datos disponibles, por lo que no se afirma una fecha de partido.';
  return [`${labelFor(type)}.`, title, `Según ${sourceName}: ${resumen}`, fechaTexto, editorialAngle(type), closingQuestion(type)].join(' ');
}
function buildItem(item, type, order) {
  const title = clean(item.title);
  const resumen = snippet(item);
  const fuente = item.fuente || item.fuente_host || 'Fuente deportiva';
  const fuenteUrl = item.link;
  const angle = editorialAngle(type);
  const fechaPub = fechaPublicacion(item);
  const tags = ['FutbolChileno', type === 'chilenos_exterior' ? 'ChilenosPorElMundo' : type === 'colo_colo' ? 'ColoColo' : 'CampeonatoChileno', 'Chile', 'Futbol', 'Shorts'];
  return {
    tipo: 'sorpresa',
    gancho: `${labelFor(type)}: ${clean(title).slice(0, 80)}`,
    subtitulo: angle,
    descripcion: `${resumen} ${angle}`,
    equipo1: item.equipo_chile || (type === 'chilenos_exterior' ? 'Chile' : 'Fútbol chileno'),
    equipo2: null,
    probabilidad: 0,
    puntos: [`HECHO PUBLICADO: ${title}`, `CONTEXTO DE LA FUENTE: ${resumen}`, fechaPub ? `PUBLICADO EL ${fechaPub} (fecha de publicación, no necesariamente fecha del partido)` : 'FECHA: la fuente no entrega una fecha de publicación verificable; no inventar fecha del partido', `ANÁLISIS EDITORIAL: ${angle}`, `SIGUIENTE DATO A COMPROBAR: ${closingQuestion(type)}`],
    narracion: buildNarration(item, type, resumen),
    emoji: type === 'colo_colo' ? '⚪⚫' : type === 'chilenos_exterior' ? '🇨🇱🌎' : '🇨🇱⚽',
    titulo_youtube: titleFor(item, type),
    descripcion_youtube: [`Esta edición de ${labelFor(type).toLowerCase()} parte de un hecho publicado y añade contexto editorial propio.`, `Hecho: ${title}`, `Lectura del canal: ${angle}`, `Fuente original: ${fuente} — ${fuenteUrl}`, `Fecha de publicación de la fuente: ${fechaPub || 'no verificada'}. No confundir con fecha del partido.`, '#FutbolChileno #Chile #Futbol #Shorts'].join('\n\n'),
    tags,
    _tipo_contenido: 'noticia',
    _match_id: null,
    _noticia_original: title,
    _fuente: fuente,
    _fuente_url: fuenteUrl,
    _fecha: FECHA,
    _fecha_publicacion_fuente: fechaPub,
    _orden: order,
    _categoria_editorial: type,
  };
}

function main() {
  const news = readJson('news-cache.json', { noticias: [] });
  const history = loadHistory();
  const candidates = Array.isArray(news.noticias) ? news.noticias.filter(n => ageHours(n) <= 72 && n.link) : [];
  if (!candidates.length) {
    fs.writeFileSync('daily-content.json', JSON.stringify({ fecha: FECHA, total: 0, contenido: [] }, null, 2));
    console.log('⚠️ No hay fuentes recientes con URL verificable. No se publica relleno.');
    return;
  }

  const usedLinks = new Set();
  const picks = [];
  const addPick = (predicate, type) => {
    if (picks.length >= MAX_ITEMS) return;
    const item = candidates.filter(predicate).filter(n => !usedLinks.has(n.link)).filter(n => !hasSimilarHook(history, n.title, 'noticia')).sort((a, b) => importance(b) - importance(a))[0];
    if (!item) return;
    usedLinks.add(item.link);
    picks.push(buildItem(item, type, picks.length + 1));
  };

  if (MODO === 'auto' || MODO === 'chile' || MODO === 'noticias') addPick(isColo, 'colo_colo');
  if (picks.length < MAX_ITEMS && (MODO === 'auto' || MODO === 'chile' || MODO === 'noticias')) addPick(isChileCompetition, 'chile');
  if (picks.length < MAX_ITEMS && (MODO === 'auto' || MODO === 'chile' || MODO === 'noticias')) addPick(isChileanAbroad, 'chilenos_exterior');

  if (picks.length < MAX_ITEMS) {
    candidates.filter(n => !usedLinks.has(n.link)).filter(n => !hasSimilarHook(history, n.title, 'noticia')).sort((a, b) => importance(b) - importance(a)).slice(0, MAX_ITEMS - picks.length).forEach(n => {
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

  picks.forEach(item => registrar(history, { matchId: null, tipoContenido: 'noticia', hook: item.gancho, titulo: item.titulo_youtube }));
  saveHistory(history);
  fs.writeFileSync('daily-content.json', JSON.stringify({ fecha: FECHA, generado_en: new Date().toISOString(), total: picks.length, modo: MODO, politica: 'SOURCE_LOCKED_EDITORIAL_V6', contenido: picks }, null, 2));
  console.log(`✅ ${picks.length} piezas reales seleccionadas`);
  picks.forEach((p, i) => console.log(`${i + 1}. [${p._fuente}] ${p.titulo_youtube}`));
}
main();
