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
function publicationTimestamp(item) {
  const raw = item.timestamp || item.pubDate || null;
  if (!raw) return null;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : null;
}
function ageHours(item) {
  const ts = publicationTimestamp(item);
  return ts === null ? Infinity : Math.max(0, (Date.now() - ts) / 36e5);
}
function validSourceUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && Boolean(url.hostname)
      && !url.username && !url.password;
  } catch (_) { return false; }
}
function isEligibleCandidate(item) {
  const timestamp = publicationTimestamp(item);
  const age = timestamp === null ? Infinity : (Date.now() - timestamp) / 36e5;
  const source = String(item.fuente || item.fuente_original || item.fuente_host || '').trim();
  return item.article_complete === true
    && typeof item.article_body === 'string' && item.article_body.trim().length >= 300
    && item.fecha_publicacion_verificada === true
    && publicationTimestamp(item) !== null
    && age >= -6 && age <= 72
    && validSourceUrl(item.link)
    && source.length >= 3
    && !/^(fuente deportiva|fuente no especificada|desconocida)$/i.test(source);
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
  return feedChile || Boolean(item.equipo_chile) || ['liga de primera', 'primera division', 'campeonato nacional', 'liga de ascenso', 'primera b', 'segunda division', 'liga 2d', 'copa chile', 'copa de la liga', 'supercopa de chile', 'liga femenina', 'ascenso femenino', 'tercera a', 'tercera b', 'futbol formativo', 'futsal', 'anfp', 'anfa'].some(k => t.includes(k));
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
  return ['champions league', 'premier league', 'laliga', 'la liga', 'serie a', 'bundesliga', 'ligue 1', 'brasileirao', 'liga mx', 'mls', 'copa libertadores', 'copa sudamericana', 'fifa', 'uefa', 'conmebol', 'mundial de clubes', 'futbol argentino'].some(k => t.includes(k));
}
function isChileanAbroad(item) {
  if (item.categoria === 'chilenos_exterior') return true;
  const t = normalize(`${item.title} ${item.description}`);
  return ['futbolista chileno', 'futbolistas chilenos', 'jugador chileno', 'jugadores chilenos', 'chileno en el extranjero', 'chilenos en el extranjero', 'alexis sanchez', 'ben brereton', 'dario osorio', 'marcelino nunez', 'gabriel suazo', 'guillermo maripan', 'victor davila', 'lucas assadi', 'lucas cepeda', 'alexander aravena', 'felipe mora', 'maximiliano falcon'].some(k => t.includes(k));
}
function importance(item) {
  let score = Number(item.viral_score || 0);
  if (isFutbolFemenino(item)) score += 60;
  if (isChileCompetition(item)) score += 55;
  if (isInternational(item) && !isChileCompetition(item)) score += 24;
  if (isChileanAbroad(item)) score += 45;
  // La noticia más reciente tiene ventaja, pero no desplaza automáticamente una noticia local importante.
  score += Math.max(0, 48 - ageHours(item)) / 4;
  score += Number(item.prioridad_fuente || 0) / 2;
  return score;
}
function snippet(item) {
  const body = clean(item.article_body || '');
  if (item.article_complete === true && body.length >= 300) {
    const sentences = body.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [body];
    let summary = '';
    for (const sentence of sentences) {
      const candidate = [summary, sentence.trim()].filter(Boolean).join(' ');
      if (candidate.length > 760) break;
      summary = candidate;
    }
    return summary.trim() || body.slice(0, 700);
  }
  return '';
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
  if (type === 'colo_colo') return 'Qué cambia para el club involucrado y qué conviene seguir en las próximas horas.';
  if (type === 'chilenos_exterior') return 'Qué cambia para el futbolista chileno involucrado y qué habrá que mirar en su próximo partido o decisión.';
  if (type === 'internacional') return 'Qué impacto tiene esta noticia en su liga, torneo o equipo, separando el hecho confirmado de la interpretación editorial.';
  return 'Qué significa esta noticia dentro de la competencia chilena y cuál es el siguiente dato que puede cambiar el escenario.';
}
function closingQuestion(type) {
  if (type === 'futbol_femenino') return '¿Qué historia o competición del fútbol femenino chileno deberíamos seguir a continuación?';
  if (type === 'colo_colo') return 'La pregunta queda abierta: ¿qué debería seguir ahora la hinchada de este equipo?';
  if (type === 'chilenos_exterior') return 'Ahora queda seguir su próximo partido y comprobar si esta tendencia se sostiene.';
  if (type === 'internacional') return '¿Qué liga o torneo internacional deberíamos seguir con más detalle en el próximo resumen?';
  return 'La próxima fecha puede entregar la pista clave para confirmar si esta noticia realmente mueve el campeonato.';
}
function labelFor(type) {
  return type === 'futbol_femenino' ? 'FÚTBOL FEMENINO' : type === 'colo_colo' ? 'COLO-COLO' : type === 'chilenos_exterior' ? 'CHILENOS POR EL MUNDO' : type === 'internacional' ? 'FÚTBOL MUNDIAL' : 'FÚTBOL CHILENO';
}
function ganchoFor(item) {
  const title = clean(item.article_title || item.title).replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim();
  return title.length > 110 ? title.slice(0, 107).replace(/\s+\S*$/, '') + '…' : title;
}
function titleFor(item) {
  const base = clean(item.article_title || item.title).replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim();
  return base.length > 100 ? base.slice(0, 97).replace(/\s+\S*$/, '') + '…' : base;
}
function fechaPublicacion(item) {
  const raw = item.pubDate || item.timestamp;
  if (!raw || Number.isNaN(Date.parse(raw))) return null;
  return new Intl.DateTimeFormat('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(raw));
}
function splitIntoPoints(text, maxPoints = 7) {
  const sentences = (String(text || '').match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
    .map(value => value.trim()).filter(value => value.length > 24);
  const chunks = [];
  for (const sentence of sentences) {
    if (sentence.length <= 118) { chunks.push(sentence); continue; }
    const words = sentence.split(/\s+/);
    let chunk = '';
    for (const word of words) {
      const next = chunk ? chunk + ' ' + word : word;
      if (next.length > 118 && chunk) { chunks.push(chunk); chunk = word; }
      else chunk = next;
    }
    if (chunk) chunks.push(chunk);
  }
  return chunks.slice(0, maxPoints);
}
function buildNarration(item, type, resumen) {
  const title = clean(item.article_title || item.title);
  const summary = clean(resumen);
  const question = closingQuestion(type);
  if (item.article_complete !== true || summary.length < 180) return '';
  const body = normalize(summary).startsWith(normalize(title)) ? summary.slice(title.length).trim() : summary;
  return [title, body, question].filter(Boolean).join(' ');
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
  const title = clean(item.article_title || item.title);
  const matchup = inferMatchup(title);
  const resumen = snippet(item);
  const fuente = item.fuente || item.fuente_original || item.fuente_host;
  const fuenteUrl = item.link;
  const timestampFuente = publicationTimestamp(item);
  const angle = editorialAngle(type);
  const fechaPub = fechaPublicacion(item);
  const tags = ['FutbolChileno', type === 'futbol_femenino' ? 'FutbolFemenino' : type === 'chilenos_exterior' ? 'ChilenosPorElMundo' : type === 'colo_colo' ? 'ColoColo' : type === 'internacional' ? 'FutbolMundial' : 'CampeonatoChileno', 'Chile', 'Futbol', 'Shorts'];
  return {
    tipo: 'sorpresa',
    gancho: ganchoFor(item),
    subtitulo: labelFor(type),
    descripcion: resumen.slice(0, 230),
    // Mostrar rivales únicamente cuando el titular de la fuente los identifica explícitamente.
    equipo1: matchup?.home || item.equipo_chile || (type === 'chilenos_exterior' ? 'Chile' : type === 'internacional' ? 'Fútbol mundial' : 'Fútbol chileno'),
    equipo2: matchup?.away || null,
    probabilidad: 0,
    puntos: [`EL HECHO: ${title}`, ...splitIntoPoints(normalize(resumen).startsWith(normalize(title)) ? resumen.slice(title.length).trim() : resumen, 7)],
    narracion: buildNarration(item, type, resumen),
    emoji: type === 'futbol_femenino' ? '⚽♀' : type === 'colo_colo' ? '⚪⚫' : type === 'chilenos_exterior' ? '🇨🇱🌎' : '🇨🇱⚽',
    titulo_youtube: titleFor(item),
    descripcion_youtube: [`Esta edición de ${labelFor(type).toLowerCase()} parte de un hecho publicado y añade contexto editorial propio.`, `Hecho: ${title}`, `Lectura del canal: ${angle}`, `Fuente original: ${fuente} — ${fuenteUrl}`, `Fecha de publicación de la fuente: ${fechaPub || 'no verificada'}. No confundir con fecha del partido.`, '#FutbolChileno #Chile #Futbol #Shorts'].join('\n\n'),
    tags,
    _tipo_contenido: 'noticia',
    _match_id: null,
    _noticia_original: title,
    _articulo_completo: true,
    _articulo_caracteres: item.article_chars || item.article_body.length,
    _fuente: fuente,
    _fuente_url: fuenteUrl,
    _fecha: FECHA,
    _fecha_publicacion_fuente: fechaPub,
    _fecha_publicacion_iso: timestampFuente === null ? null : new Date(timestampFuente).toISOString(),
    _fecha_publicacion_verificada: item.fecha_publicacion_verificada === true,
    _orden: order,
    _categoria_editorial: type,
  };
}

function main() {
  const news = readJson('news-cache.json', { noticias: [] });
  const history = loadHistory();
  const candidates = Array.isArray(news.noticias) ? news.noticias.filter(isEligibleCandidate) : [];
  if (!candidates.length) {
    fs.writeFileSync('daily-content.json', JSON.stringify({ fecha: FECHA, total: 0, contenido: [] }, null, 2));
    console.log('⚠️ No hay artículos completos recuperados desde las fuentes. Los titulares RSS no se convierten en guiones; no se publica relleno.');
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
      if (picks.length < MAX_ITEMS) addPick(n => isChileCompetition(n) && !isFutbolFemenino(n), 'chile');
      if (picks.length < MAX_ITEMS) addPick(isChileanAbroad, 'chilenos_exterior');
      if (picks.length < MAX_ITEMS) addPick(isInternational, 'internacional');
    } else if (slot === 1) {
      addPick(n => isInternational(n) && !isChileanAbroad(n) && !isFutbolFemenino(n), 'internacional');
      if (picks.length < MAX_ITEMS) addPick(isChileanAbroad, 'chilenos_exterior');
      if (picks.length < MAX_ITEMS) addPick(isChileCompetition(n), 'chile');
    } else {
      addPick(n => isFutbolFemenino(n), 'futbol_femenino');
      if (picks.length < MAX_ITEMS) addPick(isChileanAbroad, 'chilenos_exterior');
      if (picks.length < MAX_ITEMS) addPick(n => isChileCompetition(n) && !isFutbolFemenino(n), 'chile');
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

module.exports = { isFutbolFemenino, typeFor, labelFor, importance, ageHours, isEligibleCandidate, validSourceUrl };
