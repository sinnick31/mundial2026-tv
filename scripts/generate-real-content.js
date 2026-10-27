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
const { cleanVisibleText } = require('./text-sanitizer');
function clean(s = '') { return cleanVisibleText(s); }

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
  const cat = normalize(item.categoria_feed || item.categoria || '');
  const feedChile = ['chile', 'femenino', 'formativo', 'futsal', 'tercera'].includes(cat);
  // Si una fuente internacional menciona un club chileno, el tema nacional también cuenta.
  return feedChile || Boolean(item.equipo_chile) || ['liga de primera', 'primera division', 'campeonato nacional', 'liga de ascenso', 'primera b', 'segunda division', 'liga 2d', 'copa chile', 'copa chile', 'torneo chileno'].some(k => t.includes(k));
}
function isFutbolFemenino(item) {
  const category = normalize(item.categoria_feed || item.categoria || '');
  const text = normalize(`${item.title || ''} ${item.description || ''}`);
  return ['femenino', 'futbol_femenino', 'liga_femenina', 'la_roja_femenina'].includes(category)
    || /\b(liga femenina|futbol femenino|la roja femenina|seleccion femenina|copa femenina|ascenso femenino|women'?s football|women'?s champions league|femenil)\b/.test(text);
}
function isInternational(item) {
  if (item.categoria_feed === 'internacional' || item.categoria === 'internacional') return true;
  const t = normalize(String(item.title || '') + ' ' + String(item.description || ''));
  return ['champions league', 'premier league', 'laliga', 'la liga', 'serie a', 'bundesliga', 'ligue 1', 'brasileirao', 'liga mx', 'mls', 'copa libertadores', 'copa sudamericana', 'fifa', 'uefa', 'europeo', 'mundial'].some(k => t.includes(k));
}
function isChileanAbroad(item) {
  if (item.categoria === 'chilenos_exterior') return true;
  const t = normalize(`${item.title} ${item.description}`);
  return ['futbolista chileno', 'futbolistas chilenos', 'jugador chileno', 'jugadores chilenos', 'chileno en el extranjero', 'chilenos en el extranjero', 'alexis sanchez', 'ben brereton', 'dario o[...'
    ].some(k => t.includes(k));
}
function importance(item) {
  let score = Number(item.viral_score || 0);
  if (isFutbolFemenino(item)) score += 60;
  if (isColo(item)) score += 28;
  if (isChileCompetition(item)) score += 55;
  if (isInternational(item) && !isChileCompetition(item)) score += 24;
  if (isChileanAbroad(item)) score += 45;
  // La noticia más reciente tiene ventaja, pero no desplaza automáticamente una noticia local importante.
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
  if (isFutbolFemenino(item)) return 'futbol_femenino';
  if (isColo(item)) return 'colo_colo';
  if (isChileanAbroad(item)) return 'chilenos_exterior';
  if (isInternational(item)) return 'internacional';
  return 'chile';
}
function editorialAngle(type) {
  if (type === 'futbol_femenino') return 'Qué significa esta noticia para la competición femenina, la jugadora o el equipo, distinguiendo datos confirmados de análisis.';
  if (type === 'colo_colo') return 'Por qué esta noticia importa ahora para Colo-Colo y qué conviene seguir en las próximas horas.';
  if (type === 'chilenos_exterior') return 'Qué cambia para el futbolista chileno involucrado y qué habrá que mirar en su próximo partido o decisión.';
  if (type === 'internacional') return 'Qué impacto tiene esta noticia en su liga, torneo o equipo, separando el hecho confirmado de la interpretación editorial.';
  return 'Qué significa esta noticia dentro de la competencia chilena y cuál es el siguiente dato que puede cambiar el escenario.';
}
function closingQuestion(type) {
  if (type === 'futbol_femenino') return '¿Qué historia o competición del fútbol femenino chileno deberíamos seguir a continuación?';
  if (type === 'colo_colo') return 'La pregunta queda abierta: ¿qué debería ser lo siguiente que mire el hincha albo?';
  if (type === 'chilenos_exterior') return 'Ahora queda seguir su próximo partido y comprobar si esta tendencia se sostiene.';
  if (type === 'internacional') return '¿Qué liga o torneo internacional deberíamos seguir con más detalle en el próximo resumen?';
  return 'La próxima fecha puede entregar la pista clave para confirmar si esta noticia realmente mueve el campeonato.';
}
function labelFor(type) {
  return type === 'futbol_femenino' ? 'FÚTBOL FEMENINO' : type === 'colo_colo' ? 'COLO-COLO' : type === 'chilenos_exterior' ? 'CHILENOS POR EL MUNDO' : type === 'internacional' ? 'FÚTBOL MUNDIAL' : 'FÚTBOL CHILENO';
}
function truncatedTitle(value, maxLen = 85) {
  const title = clean(value || '').replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (title.length <= maxLen) return title;
  return `${title.slice(0, maxLen - 1).replace(/\s+\S*$/, '')}…`;
}
function sentenceFromType(type, title) {
  const base = truncatedTitle(title, 88);
  if (type === 'colo_colo') return `Colo Colo queda en un punto decisivo tras ${base}.`;
  if (type === 'futbol_femenino') return `El fútbol femenino chileno se mueve tras ${base}.`;
  if (type === 'chilenos_exterior') return `El caso de ${base} gana peso en el contexto internacional.`;
  if (type === 'internacional') return `El panorama internacional cambia tras ${base}.`;
  return `El fútbol chileno toma un nuevo giro con ${base}.`;
}
function buildLead(type, title) {
  const base = truncatedTitle(title, 72);
  if (type === 'colo_colo') {
    return `Colo Colo: ${base}`;
  }
  if (type === 'futbol_femenino') {
    return `Fútbol femenino: ${base}`;
  }
  if (type === 'chilenos_exterior') {
    return `Chilenos por el mundo: ${base}`;
  }
  if (type === 'internacional') {
    return `Fútbol mundial: ${base}`;
  }
  return `Fútbol chileno: ${base}`;
}
function buildDescription(type, title, summary, angle, fechaPub) {
  const hecho = sentenceFromType(type, title);
  const contexto = typeof summary === 'string' && summary.trim() ? `El contexto es claro: ${summary.trim()}` : 'El contexto explica por qué esto importa en este momento.';
  const impacto = fechaPub ? `Esto se publica el ${fechaPub}, pero la relevancia real está en cómo cambia el contexto del momento.` : 'Esto importa porque cambia el escenario inmediato.';
  return `${hecho} ${contexto} ${impacto} ${angle}`.replace(/\s+/g, ' ').trim();
}
function buildPoints(type, title, summary, fechaPub) {
  const he = truncatedTitle(title, 90);
  const ctx = typeof summary === 'string' && summary.trim() ? summary.trim() : 'El dato no aparece aislado, sino dentro del contexto deportivo del momento.';
  const impacto = fechaPub ? `La fecha de publicación es ${fechaPub}, pero lo que pesa es el cambio real en el escenario del club o la competencia.` : 'Lo relevante es el cambio real en el panorama del momento.';
  const lineas = [
    `HECHO: ${he}`,
    `CONTEXTO: ${ctx}`,
    `QUÉ CAMBIA: ${impacto}`,
  ];
  if (type === 'colo_colo') {
    lineas[2] = 'QUÉ CAMBIA: Este dato altera la presión, la tabla y la respuesta que Colo Colo necesita en la próxima fecha.';
  }
  if (type === 'futbol_femenino') {
    lineas[2] = 'QUÉ CAMBIA: Esto modifica la sensación del equipo y la presión sobre la competencia femenina.';
  }
  if (type === 'chilenos_exterior') {
    lineas[2] = 'QUÉ CAMBIA: El rol del jugador y su continuidad pueden cambiar por la forma en que responda al siguiente momento.';
  }
  if (type === 'internacional') {
    lineas[2] = 'QUÉ CAMBIA: El torneo o la liga internacional quedan con un nuevo punto de tensión o una nueva lectura.';
  }
  return lineas;
}
function ganchoFor(item, type) {
  const title = clean(item.title).replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim();
  const base = truncatedTitle(title, 78);
  if (type === 'colo_colo') return `Colo Colo: ${base}`;
  if (type === 'futbol_femenino') return `Fútbol femenino: ${base}`;
  if (type === 'chilenos_exterior') return `Chilenos por el mundo: ${base}`;
  if (type === 'internacional') return `Fútbol mundial: ${base}`;
  return `Fútbol chileno: ${base}`;
}
function titleFor(item, type) {
  const base = truncatedTitle(item.title, 70);
  const label = labelFor(type);
  const suffixMap = {
    colo_colo: ' | El punto que importa',
    futbol_femenino: ' | El dato clave',
    chilenos_exterior: ' | Qué cambia para él',
    internacional: ' | El cambio del torneo',
  };
  const suffix = suffixMap[type] || ' | Lo que cambia';
  return `${label}: ${base}${suffix}`.slice(0, 100);
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
  const lead = buildLead(type, title);
  const hecho = sentenceFromType(type, title);
  const contexto = typeof resumen === 'string' && resumen.trim() ? `El contexto es claro: ${resumen.trim()}` : 'El contexto ya da la clave del momento.';
  const impacto = type === 'colo_colo'
    ? 'Esto cambia la presión del equipo y el margen de error de la próxima fecha.'
    : type === 'futbol_femenino'
      ? 'Esto modifica la sensación del equipo y la exigencia del siguiente partido.'
      : type === 'chilenos_exterior'
        ? 'Esto cambia el rol del jugador y lo que habrá que seguir en el siguiente partido o decisión.'
        : type === 'internacional'
          ? 'Esto redefine la lectura del torneo y la forma en que se vive la siguiente jornada.'
          : 'Esto cambia la lectura de la competencia y la presión sobre la próxima fecha.';
  const cierre = fecha ? `La fuente ${sourceName} lo publicó el ${fecha}, pero la pregunta real es cuánto puede sostenerse ese cambio.` : `La pregunta real es si esto se sostiene o si la próxima fecha cambia la lectura del momento.`;
  return `${lead}. ${hecho} ${contexto} ${impacto} ${cierre} ${closingQuestion(type)}`.replace(/\s+/g, ' ').trim();
}
function inferMatchup(title) {
  const value = clean(title);
  const match = value.match(/^(.{2,48}?)\s+(?:vs\.?|versus|contra)\s+(.{2,48}?)(?=\s*[:|–—]\s*|$)/i);
  if (!match) return null;
  const home = clean(match[1]).replace(/^.*?:\s*/, '').trim();
  const away = clean(match[2]).trim();
  if (home.length < 2 || away.length < 2 || normalize(home) === normalize(away)) return null;
  return { home, away };
}

function buildItem(item, type, order) {
  const title = clean(item.title);
  const matchup = inferMatchup(title);
  const resumen = snippet(item);
  const fuente = item.fuente || item.fuente_host || 'Fuente deportiva';
  const fuenteUrl = item.link;
  const angle = editorialAngle(type);
  const fechaPub = fechaPublicacion(item);
  const tags = ['FutbolChileno', type === 'futbol_femenino' ? 'FutbolFemenino' : type === 'chilenos_exterior' ? 'ChilenosPorElMundo' : type === 'colo_colo' ? 'ColoColo' : type === 'internacional' ? 'FutbolMundial' : 'CompetenciaChilena', 'Shorts', 'Futbol'];
  const lead = buildLead(type, title);
  const descripcion = buildDescription(type, title, resumen, angle, fechaPub);
  const puntos = buildPoints(type, title, resumen, fechaPub);
  return {
    tipo: 'sorpresa',
    gancho: lead,
    subtitulo: angle,
    descripcion,
    // Mostrar rivales únicamente cuando el titular de la fuente los identifica explícitamente.
    equipo1: matchup?.home || item.equipo_chile || (type === 'chilenos_exterior' ? 'Chile' : type === 'internacional' ? 'Fútbol mundial' : 'Fútbol chileno'),
    equipo2: matchup?.away || null,
    probabilidad: 0,
    puntos,
    narracion: buildNarration(item, type, resumen),
    emoji: type === 'futbol_femenino' ? '⚽♀' : type === 'colo_colo' ? '⚪⚫' : type === 'chilenos_exterior' ? '🇨🇱🌎' : '🇨🇱⚽',
    titulo_youtube: titleFor(item, type),
    descripcion_youtube: [`Esta edición de ${labelFor(type).toLowerCase()} parte de un hecho publicado y añade contexto editorial propio.`, `Hecho: ${title}`, `Lectura del canal: ${angle}`, `Fuente: ${fuenteUrl}`].join(' '),
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

  const modoEditorial = ['auto', 'chile', 'noticias'].includes(MODO);
  // Tres ventanas diarias: dos priorizan Chile; una reserva espacio al fútbol mundial.
  // En ejecuciones manuales fuera de esas horas se usa el día del mes para mantener rotación.
  if (modoEditorial) {
    const utcHour = new Date().getUTCHours();
    const scheduledHours = [15, 19, 23];
    const scheduledSlot = scheduledHours.indexOf(utcHour);
    const slot = scheduledSlot >= 0 ? scheduledSlot : (new Date().getUTCDate() % 3);
    if (slot === 0) {
      addPick(n => isFutbolFemenino(n), 'futbol_femenino');
      if (picks.length < MAX_ITEMS) addPick(n => isChileCompetition(n) && !isColo(n) && !isFutbolFemenino(n), 'chile');
      if (picks.length < MAX_ITEMS) addPick(isColo, 'colo_colo');
      if (picks.length < MAX_ITEMS) addPick(isChileanAbroad, 'chilenos_exterior');
      if (picks.length < MAX_ITEMS) addPick(isInternational, 'internacional');
    } else if (slot === 1) {
      addPick(n => isInternational(n) && !isChileanAbroad(n) && !isFutbolFemenino(n), 'internacional');
      if (picks.length < MAX_ITEMS) addPick(isChileanAbroad, 'chilenos_exterior');
      if (picks.length < MAX_ITEMS) addPick(n => isChileCompetition(n) && !isColo(n), 'chile');
      if (picks.length < MAX_ITEMS) addPick(isColo, 'colo_colo');
    } else {
      addPick(n => isFutbolFemenino(n), 'futbol_femenino');
      if (picks.length < MAX_ITEMS) addPick(isChileanAbroad, 'chilenos_exterior');
      if (picks.length < MAX_ITEMS) addPick(n => isChileCompetition(n) && !isColo(n) && !isFutbolFemenino(n), 'chile');
      if (picks.length < MAX_ITEMS) addPick(isColo, 'colo_colo');
      if (picks.length < MAX_ITEMS) addPick(isInternational, 'internacional');
    }
  }

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
if (require.main === module) main();

module.exports = { isFutbolFemenino, typeFor, labelFor, buildItem };
