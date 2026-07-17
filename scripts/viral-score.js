/**
 * viral-score.js — FOOTBALL AI STUDIO v4.0
 *
 * Asigna un puntaje 0–100 a cada noticia ANTES de gastar tokens de Gemini.
 * Solo el Top-N con mayor potencial viral pasa a producción de video.
 *
 * Factores:
 *  - Categoría (Chile recibe el bonus más alto: ventaja competitiva del canal)
 *  - Frescura (noticias de las últimas horas valen más)
 *  - Señales virales en el titular (récord, oficial, polémica, cifras)
 *  - Importancia del club/figura mencionada
 *  - Penalización a contenido genérico/institucional (aburre al algoritmo)
 */

const { CATEGORIAS, CHILE } = require('../config/ligas');

function normalizar(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Señales que disparan clicks en Shorts ──────────────────────────────────
const SENALES_VIRALES = [
  { re: /\b(oficial|confirmado|anuncia)\b/, pts: 12 },
  { re: /\b(record|historico|primera vez|nunca)\b/, pts: 12 },
  { re: /\b(fichaje|traspaso|refuerzo|millones)\b/, pts: 10 },
  { re: /\b(polemica|var|expulsion|escandalo|sancion)\b/, pts: 10 },
  { re: /\b(crisis|despedido|renuncia|quiebre)\b/, pts: 9 },
  { re: /\b(goleada|hat.?trick|triplete)\b/, pts: 9 },
  { re: /\b(lesion|baja|descartado)\b/, pts: 6 },
  { re: /\d+\s*[-x]\s*\d+/, pts: 8 },              // marcador "3-1"
  { re: /\b\d+\s*(goles|millones|partidos|anos|puntos)\b/, pts: 6 }, // cifra concreta
  { re: /\b(clasific|eliminad|campeon|titulo|final)\w*/, pts: 8 },
];

// ─── Clubes/figuras que mueven audiencia ────────────────────────────────────
const GIGANTES = [
  'colo colo', 'u de chile', 'universidad de chile', 'universidad catolica',
  'real madrid', 'barcelona', 'manchester city', 'liverpool', 'arsenal',
  'bayern', 'psg', 'boca', 'river', 'messi', 'mbappe', 'haaland',
  'vinicius', 'lamine yamal', 'alexis sanchez', 'la roja',
];

// ─── Contenido que YouTube NO distribuye (institucional/genérico) ───────────
const PENALIZACIONES = [
  { re: /\b(comunicado|directorio|asamblea|federacion anuncia|anfp informa)\b/, pts: -12 },
  { re: /\b(entradas|tickets|donde ver|horario|como ver)\b/, pts: -8 },
  { re: /\b(opinion|columna|editorial)\b/, pts: -6 },
];

/**
 * Detecta la categoría dominante de una noticia.
 * Devuelve { categoria, bonus }
 */
function detectarCategoria(textoNorm) {
  let mejor = { categoria: 'internacional', bonus: 0 };
  for (const [nombre, cfg] of Object.entries(CATEGORIAS)) {
    const hits = cfg.keywords.filter((kw) => textoNorm.includes(kw)).length;
    if (hits > 0 && cfg.prioridadBase > mejor.bonus) {
      mejor = { categoria: nombre, bonus: cfg.prioridadBase };
    }
  }
  return mejor;
}

/**
 * Detecta equipo chileno mencionado (para SEO y para el prompt de Gemini).
 */
function detectarEquipoChileno(textoNorm) {
  // Alias más largos primero — evita que "la u" capture antes que "la uc"
  const aliasOrdenados = Object.entries(CHILE.alias).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, nombreReal] of aliasOrdenados) {
    if (textoNorm.includes(alias)) return nombreReal;
  }
  const todos = [...CHILE.equiposPrimeraA, ...CHILE.equiposPrimeraB];
  for (const equipo of todos) {
    if (textoNorm.includes(normalizar(equipo))) return equipo;
  }
  return null;
}

/**
 * Puntaje principal 0–100.
 * @param {object} noticia — { title, description, timestamp, categoria? }
 * @returns {object} — { score, categoria, equipoChile, razones[] }
 */
function calcularViralScore(noticia) {
  const textoNorm = normalizar(`${noticia.title} ${noticia.description || ''}`);
  const razones = [];
  let score = 25; // base

  // 1. Categoría (Chile = bonus máximo)
  const { categoria, bonus } = detectarCategoria(textoNorm);
  const catFinal = noticia.categoria && CATEGORIAS[noticia.categoria] ? noticia.categoria : categoria;
  const bonusFinal = CATEGORIAS[catFinal] ? CATEGORIAS[catFinal].prioridadBase : bonus;
  score += bonusFinal;
  razones.push(`categoria:${catFinal}(+${bonusFinal})`);

  // 2. Frescura — decae con las horas
  if (noticia.timestamp) {
    const horas = (Date.now() - new Date(noticia.timestamp).getTime()) / 36e5;
    const frescura = horas <= 3 ? 15 : horas <= 12 ? 10 : horas <= 24 ? 5 : horas <= 48 ? 0 : -10;
    score += frescura;
    razones.push(`frescura:${Math.round(horas)}h(${frescura >= 0 ? '+' : ''}${frescura})`);
  }

  // 3. Señales virales en el titular
  for (const s of SENALES_VIRALES) {
    if (s.re.test(textoNorm)) { score += s.pts; razones.push(`senal:${s.re.source.slice(0, 20)}(+${s.pts})`); }
  }

  // 4. Gigantes
  const gigante = GIGANTES.find((g) => textoNorm.includes(g));
  if (gigante) { score += 10; razones.push(`gigante:${gigante}(+10)`); }

  // 5. Penalizaciones
  for (const p of PENALIZACIONES) {
    if (p.re.test(textoNorm)) { score += p.pts; razones.push(`penal(${p.pts})`); }
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    categoria: catFinal,
    equipoChile: detectarEquipoChileno(textoNorm),
    razones,
  };
}

/**
 * Ordena noticias por score y devuelve el Top-N sobre el umbral.
 */
function seleccionarTop(noticias, { top = 10, umbral = 40 } = {}) {
  return noticias
    .map((n) => ({ ...n, viral: calcularViralScore(n) }))
    .filter((n) => n.viral.score >= umbral)
    .sort((a, b) => b.viral.score - a.viral.score)
    .slice(0, top);
}

module.exports = { calcularViralScore, seleccionarTop, detectarEquipoChileno, normalizar };
