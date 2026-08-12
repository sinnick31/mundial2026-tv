/**
 * generate-real-content.js — REAL FOOTBALL NEWSROOM v5
 *
 * No usa IA para inventar noticias, cifras, resultados ni titulares falsos.
 * Trabaja exclusivamente con noticias ingeridas desde news-cache.json y con
 * datos estructurados de matches-cache.json cuando existen.
 *
 * La voz puede seguir usando el motor TTS existente, pero el contenido factual
 * queda bloqueado a las fuentes registradas.
 */

const fs = require('fs');
const { loadHistory, saveHistory, hasSimilarHook, registrar } = require('./content-history');

const MAX_ITEMS = Math.min(parseInt(process.env.MAX_ITEMS || '3', 10), 3);
const MODO = process.env.MODO || 'auto';
const FECHA = new Date().toISOString().split('T')[0];

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return fallback;
  }
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

function choose(candidates, predicate, used) {
  return candidates
    .filter(predicate)
    .filter(n => n.link && !used.has(n.link))
    .filter(n => !hasSimilarHook(used.history, n.title, 'noticia'))
    .sort((a, b) => importance(b) - importance(a))[0] || null;
}

function snippet(item) {
  const desc = clean(item.description || '');
  if (desc.length >= 70) return desc.slice(0, 220).replace(/\s+\S*$/, '') + '.';
  return clean(item.title).slice(0, 180);
}

function focusText(item, type) {
  if (type === 'colo_colo') return 'El foco está en Colo-Colo y en qué significa esta novedad para el presente inmediato del Cacique.';
  if (type === 'chilenos_exterior') return 'La clave para seguir al fútbol chileno también está fuera de Chile: rendimiento, decisiones y protagonismo de nuestros jugadores.';
  return 'La noticia se conecta directamente con la competencia chilena y con lo que viene para los clubes involucrados.';
}

function buildItem(item, type, order) {
  const title = clean(item.title);
  const label = type === 'colo_colo' ? 'COLO-COLO' : type === 'chilenos_exterior' ? 'CHILENOS EN EL EXTERIOR' : 'FÚTBOL CHILENO';
  const emoji = type === 'colo_colo' ? '⚪⚫' : type === 'chilenos_exterior' ? '🇨🇱🌎' : '🇨🇱⚽';
  const shortTitle = title.length > 62 ? `${title.slice(0, 59).replace(/\s+\S*$/, '')}…` : title;
  const gancho = type === 'colo_colo' ? `COLO-COLO: ${shortTitle}` : type === 'chilenos_exterior' ? `CHILENOS EN EL EXTERIOR: ${shortTitle}` : `FÚTBOL CHILENO: ${shortTitle}`;
  const resumen = snippet(item);
  const descripcion = `${resumen} ${focusText(item, type)}`;
  const fuente = item.fuente || item.fuente_host || 'Fuente deportiva';
  const fuenteUrl = item.link;
  const tags = [
    'FutbolChileno',
    'ColoColo',
    type === 'chilenos_exterior' ? 'ChilenosEnElExterior' : type === 'colo_colo' ? 'Cacique' : 'CampeonatoChileno',
    'Chile', 'Futbol', 'Shorts',
  ];

  return {
    tipo: 'sorpresa',
    gancho,
    subtitulo: type === 'colo_colo' ? 'La información que importa para el Cacique.' : type === 'chilenos_exterior' ? 'La novedad que sigue al fútbol chileno fuera del país.' : 'El dato que mueve hoy al fútbol chileno.',
    descripcion,
    equipo1: item.equipo_chile || (type === 'chilenos_exterior' ? 'Chile' : 'Fútbol chileno'),
    equipo2: null,
    probabilidad: 0,
    puntos: [
      `Hecho: ${title}`,
      `Contexto: ${resumen}`,
      `Lectura editorial: ${focusText(item, type)}`,
    ],
    emoji,
    titulo_youtube: `${label}: ${shortTitle}`.slice(0, 100),
    descripcion_youtube: [
      `${resumen}`,
      `${focusText(item, type)} Este video separa el hecho publicado del comentario editorial y no agrega cifras que no estén en la fuente.`,
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

  // Reservas editoriales. Colo-Colo siempre intenta entrar primero.
  const usedLinks = new Set();
  usedLinks.history = history;
  const picks = [];

  const addPick = (predicate, type) => {
    if (picks.length >= MAX_ITEMS) return;
    const item = candidates.filter(predicate).filter(n => !usedLinks.has(n.link)).filter(n => !hasSimilarHook(history, n.title, 'noticia')).sort((a, b) => importance(b) - importance(a))[0];
    if (!item) return;
    usedLinks.add(item.link);
    picks.push(buildItem(item, type, picks.length + 1));
  };

  if (MODO === 'auto' || MODO === 'chile' || MODO === 'noticias') addPick(isColo, 'colo_colo');
  if (MODO === 'auto' || MODO === 'chile' || MODO === 'noticias') addPick(isChileCompetition, 'chile');
  if (MODO === 'auto' || MODO === 'noticias') addPick(isChileanAbroad, 'chilenos_exterior');

  // Relleno solo con otra fuente real, nunca con texto inventado.
  if (picks.length < MAX_ITEMS && (MODO === 'auto' || MODO === 'noticias' || MODO === 'chile')) {
    candidates
      .filter(n => !usedLinks.has(n.link))
      .filter(n => !hasSimilarHook(history, n.title, 'noticia'))
      .sort((a, b) => importance(b) - importance(a))
      .slice(0, MAX_ITEMS - picks.length)
      .forEach(n => {
        if (picks.length >= MAX_ITEMS) return;
        usedLinks.add(n.link);
        const type = isColo(n) ? 'colo_colo' : isChileanAbroad(n) ? 'chilenos_exterior' : 'chile';
        picks.push(buildItem(n, type, picks.length + 1));
      });
  }

  if (!picks.length) {
    fs.writeFileSync('daily-content.json', JSON.stringify({ fecha: FECHA, total: 0, contenido: [] }, null, 2));
    console.log('⚠️ No hay una pieza nueva y suficientemente distinta. No se publica.');
    return;
  }

  picks.forEach(item => {
    registrar(history, {
      matchId: null,
      tipoContenido: 'noticia',
      hook: item.gancho,
      titulo: item.titulo_youtube,
    });
  });
  saveHistory(history);

  const output = {
    fecha: FECHA,
    generado_en: new Date().toISOString(),
    total: picks.length,
    modo: MODO,
    politica: 'SOURCE_LOCKED_REAL_CONTENT_V5',
    contenido: picks,
  };
  fs.writeFileSync('daily-content.json', JSON.stringify(output, null, 2));

  console.log(`✅ ${picks.length} piezas reales seleccionadas`);
  picks.forEach((p, i) => console.log(`${i + 1}. [${p._fuente}] ${p.titulo_youtube}`));
}

main();
