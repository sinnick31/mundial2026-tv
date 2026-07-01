/**
 * generate-daily-content.js (v3 — CON NOTICIAS REALES DE INTERNET)
 *
 * Mejoras vs v2:
 * 1. Usa noticias reales del día (news-cache.json de fetch-news.js)
 * 2. Usa partidos en tiempo real (matches-cache.json de fetch-matches.js)
 * 3. 5 tipos de contenido: narrativa, prediccion, noticia, ranking, en_vivo
 * 4. Contenido basado en actualidad del día, no solo datos de API
 * 5. Anti-duplicados mejorado con historial persistente
 * 6. Soporte para modo: auto | noticias | partidos | predicciones | ranking
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const https = require('https');
const {
  loadHistory, saveHistory, hasMatch, hasSimilarHook, registrar,
} = require('./content-history');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const COMPETITION_ID = process.env.COMPETITION_ID || '2000';
const MAX_ITEMS = parseInt(process.env.MAX_ITEMS || '4', 10);
const MODO = process.env.MODO || 'auto';

// ─── Cargar datos de noticias y partidos ─────────────────────────────────────

function loadNewsCache() {
  try {
    if (fs.existsSync('news-cache.json')) {
      return JSON.parse(fs.readFileSync('news-cache.json', 'utf8'));
    }
  } catch (e) {}
  return { noticias: [], ultima_actualizacion: null };
}

function loadMatchesCache() {
  try {
    if (fs.existsSync('matches-cache.json')) {
      return JSON.parse(fs.readFileSync('matches-cache.json', 'utf8'));
    }
  } catch (e) {}
  return { partidos_recientes: [], partidos_en_curso: [], partidos_proximos: [], tabla_posiciones: [] };
}

// ─── Cliente HTTP simple para football-data.org (fallback) ───────────────────

function fetchFootballData(endpoint) {
  return new Promise((resolve, reject) => {
    if (!FOOTBALL_API_KEY) { resolve({ matches: [] }); return; }
    const options = {
      hostname: 'api.football-data.org',
      path: `/v4${endpoint}`,
      headers: { 'X-Auth-Token': FOOTBALL_API_KEY },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// ─── Prompts Gemini ───────────────────────────────────────────────────────────

function promptNarrativaPartido(partido) {
  return `Eres guionista deportivo de TV (ESPN/Fox Sports) para un Short de YouTube.

Partido FINALIZADO: ${partido.equipo1} ${partido.golesLocal}-${partido.golesVisita} ${partido.equipo2}
Fase del Mundial 2026: ${partido.fase}

REGLA: NO uses el marcador como gancho. Crea un ángulo narrativo de TV (la jugada clave, el misterio táctico, por qué ganó quien ganó).

Responde SOLO con JSON válido sin markdown:
{
  "tipo": "narrativa",
  "gancho": "ángulo narrativo en MAYÚSCULAS máx 6 palabras SIN marcador",
  "subtitulo": "frase que profundiza el gancho máx 10 palabras",
  "equipo1": "${partido.equipo1}",
  "equipo2": "${partido.equipo2}",
  "descripcion": "análisis narrativo 2 frases máx 40 palabras",
  "probabilidad": 0,
  "puntos": ["dato/análisis 1", "dato/análisis 2", "dato/análisis 3"],
  "emoji": "emoji relacionado",
  "titulo_youtube": "título que NO revela el marcador máx 80 chars",
  "descripcion_youtube": "descripción con hashtags 3 párrafos #Mundial2026 #Shorts",
  "tags": ["tag1","tag2","tag3","tag4","tag5"]
}`;
}

function promptPrediccionPartido(partido) {
  return `Eres analista deportivo de TV generando predicción REAL antes de un partido del Mundial 2026.

Partido PRÓXIMO: ${partido.equipo1} vs ${partido.equipo2}
Fase: ${partido.fase}
Fecha: ${partido.fecha}

Genera predicción concreta, justificada y polémica. Responde SOLO con JSON válido sin markdown:
{
  "tipo": "eliminacion",
  "gancho": "texto MAYÚSCULAS máx 5 palabras que genere shock",
  "subtitulo": "frase explicativa máx 10 palabras",
  "equipo1": "${partido.equipo1}",
  "equipo2": "${partido.equipo2}",
  "descripcion": "predicción concreta 2 frases máx 40 palabras",
  "probabilidad": 75,
  "puntos": ["razón táctica 1", "razón táctica 2", "razón táctica 3"],
  "emoji": "emoji relacionado",
  "titulo_youtube": "título predicción ANTES del partido máx 80 chars",
  "descripcion_youtube": "descripción con hashtags 3 párrafos #Mundial2026 #Shorts",
  "tags": ["tag1","tag2","tag3","tag4","tag5"]
}`;
}

function promptNoticiaDia(noticia) {
  return `Eres editor de noticias deportivas para YouTube Shorts. Debes convertir esta noticia real del día en un Short viral.

NOTICIA REAL: "${noticia.title}"
FUENTE: ${noticia.fuente || 'Prensa deportiva'}
RESUMEN: ${noticia.description || ''}

Crea contenido que amplíe y contextualice esta noticia para el Mundial 2026. Responde SOLO con JSON válido sin markdown:
{
  "tipo": "sorpresa",
  "gancho": "titular viral en MAYÚSCULAS máx 6 palabras",
  "subtitulo": "contexto que amplía la noticia máx 10 palabras",
  "equipo1": "País o equipo principal de la noticia",
  "equipo2": null,
  "descripcion": "análisis de la noticia en 2 frases máx 40 palabras",
  "probabilidad": 80,
  "puntos": ["dato clave 1", "dato clave 2", "impacto en el Mundial"],
  "emoji": "emoji temático",
  "titulo_youtube": "título YouTube optimizado para la noticia máx 80 chars",
  "descripcion_youtube": "descripción con hashtags 3 párrafos #Mundial2026 #Noticias #Shorts",
  "tags": ["tag1","tag2","tag3","tag4","tag5"]
}`;
}

function promptRanking(temasEvitar) {
  return `Eres analista de TV deportiva generando un ranking viral sobre el Mundial 2026.

NO repitas estos enfoques ya usados: ${temasEvitar.join(' | ') || 'ninguno aún'}

Elige un ángulo ORIGINAL y ESPECÍFICO. Responde SOLO con JSON válido sin markdown:
{
  "tipo": "sorpresa",
  "gancho": "nombre del ranking MAYÚSCULAS máx 5 palabras",
  "subtitulo": "subtítulo explicativo máx 8 palabras",
  "equipo1": "Ranking",
  "equipo2": null,
  "descripcion": "criterio del ranking máx 30 palabras",
  "probabilidad": 75,
  "puntos": ["#1: ...", "#2: ...", "#3: ...", "#4: ...", "#5: ..."],
  "emoji": "emoji temático",
  "titulo_youtube": "título YouTube optimizado máx 80 chars",
  "descripcion_youtube": "descripción con hashtags 3 párrafos #Mundial2026 #Ranking #Shorts",
  "tags": ["tag1","tag2","tag3","tag4","tag5"]
}`;
}

// ─── Llamada a Gemini ─────────────────────────────────────────────────────────

async function llamarGemini(model, prompt) {
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
}

// ─── Pipeline principal ───────────────────────────────────────────────────────

async function generateContent() {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const history = loadHistory();
  const fecha = new Date().toISOString().split('T')[0];
  const results = [];

  // Cargar datos de noticias y partidos pre-obtenidos
  const newsCache = loadNewsCache();
  const matchesCache = loadMatchesCache();
  
  const noticiasHoy = (newsCache.noticias || []).slice(0, 15);
  const recientes = matchesCache.partidos_recientes || [];
  const proximos = matchesCache.partidos_proximos || [];
  const enCurso = matchesCache.partidos_en_curso || [];

  console.log(`\n📊 Datos disponibles:`);
  console.log(`  📰 Noticias del día: ${noticiasHoy.length}`);
  console.log(`  ⚽ Partidos recientes: ${recientes.length}`);
  console.log(`  🔴 Partidos en curso: ${enCurso.length}`);
  console.log(`  📅 Próximos partidos: ${proximos.length}`);
  console.log(`  🎯 Modo: ${MODO} | Max items: ${MAX_ITEMS}\n`);

  // Filtrar partidos ya cubiertos
  const recientesNuevos = recientes.filter(p => !hasMatch(history, p.id));
  const proximosNuevos = proximos.filter(p => !hasMatch(history, p.id));

  // ─── Prioridad según MODO ──────────────────────────────────────────────────
  const queue = [];

  // Si hay partidos en curso → MÁXIMA PRIORIDAD (contenido en vivo)
  if (enCurso.length > 0 && MODO !== 'noticias' && MODO !== 'ranking') {
    enCurso.slice(0, 2).forEach(p => queue.push({ tipo: 'prediccion', data: p }));
  }

  // Partidos recientes con narrativa
  if (MODO === 'auto' || MODO === 'partidos') {
    recientesNuevos.slice(0, 3).forEach(p => queue.push({ tipo: 'narrativa', data: p }));
  }

  // Próximos partidos con predicción
  if (MODO === 'auto' || MODO === 'predicciones') {
    proximosNuevos.slice(0, 2).forEach(p => queue.push({ tipo: 'prediccion', data: p }));
  }

  // Noticias del día
  if (MODO === 'auto' || MODO === 'noticias') {
    const noticiasNuevas = noticiasHoy
      .filter(n => !hasSimilarHook(history, n.title, 'noticia'))
      .slice(0, 3);
    noticiasNuevas.forEach(n => queue.push({ tipo: 'noticia', data: n }));
  }

  // Procesar cola hasta MAX_ITEMS
  for (const item of queue.slice(0, MAX_ITEMS)) {
    if (results.length >= MAX_ITEMS) break;
    
    const label = item.tipo === 'noticia' 
      ? `Noticia: ${item.data.title?.substring(0, 50)}...`
      : `${item.tipo === 'narrativa' ? 'Narrativa' : 'Predicción'}: ${item.data.equipo1} vs ${item.data.equipo2}`;
    
    console.log(`⚙️ Generando: ${label}`);
    
    try {
      let prompt, data;
      
      if (item.tipo === 'narrativa') {
        prompt = promptNarrativaPartido(item.data);
        data = await llamarGemini(model, prompt);
        registrar(history, { matchId: item.data.id, tipoContenido: 'narrativa', hook: data.gancho, titulo: data.titulo_youtube });
        results.push({ ...data, _tipo_contenido: 'narrativa', _match_id: item.data.id, _goles_local: item.data.golesLocal, _goles_visita: item.data.golesVisita, _fase: item.data.fase, _label: label, _fecha: fecha, _orden: results.length + 1 });
      } else if (item.tipo === 'prediccion') {
        prompt = promptPrediccionPartido(item.data);
        data = await llamarGemini(model, prompt);
        registrar(history, { matchId: item.data.id, tipoContenido: 'prediccion', hook: data.gancho, titulo: data.titulo_youtube });
        results.push({ ...data, _tipo_contenido: 'prediccion', _match_id: item.data.id, _fase: item.data.fase, _label: label, _fecha: fecha, _orden: results.length + 1 });
      } else if (item.tipo === 'noticia') {
        prompt = promptNoticiaDia(item.data);
        data = await llamarGemini(model, prompt);
        registrar(history, { matchId: null, tipoContenido: 'noticia', hook: data.gancho, titulo: data.titulo_youtube });
        results.push({ ...data, _tipo_contenido: 'noticia', _match_id: null, _noticia_original: item.data.title, _fuente: item.data.fuente, _label: label, _fecha: fecha, _orden: results.length + 1 });
      }
      
      console.log(`  ✅ ${data.gancho}`);
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
    }
  }

  // ─── Completar cupo restante con rankings únicos ──────────────────────────
  if (MODO === 'auto' || MODO === 'ranking') {
    const huecosRestantes = MAX_ITEMS - results.length;
    if (huecosRestantes > 0) {
      console.log(`\n⚙️ Generando ${huecosRestantes} ranking(s) único(s)...`);
      const temasUsados = history.items
        .filter(i => i.tipo_contenido === 'ranking')
        .slice(-10)
        .map(i => i.hook);

      for (let i = 0; i < huecosRestantes; i++) {
        try {
          const data = await llamarGemini(model, promptRanking(temasUsados));
          if (hasSimilarHook(history, data.gancho, 'ranking')) {
            console.log(`  ⚠️ Ranking similar descartado: ${data.gancho}`);
            continue;
          }
          results.push({ ...data, _tipo_contenido: 'ranking', _match_id: null, _label: `Ranking: ${data.gancho}`, _fecha: fecha, _orden: results.length + 1 });
          registrar(history, { matchId: null, tipoContenido: 'ranking', hook: data.gancho, titulo: data.titulo_youtube });
          temasUsados.push(data.gancho);
          console.log(`  ✅ ${data.gancho}`);
          await new Promise(r => setTimeout(r, 1500));
        } catch (err) {
          console.error(`  ❌ Error ranking: ${err.message}`);
        }
      }
    }
  }

  // ─── Guardar resultados ──────────────────────────────────────────────────
  if (results.length === 0) {
    console.log('\n⚠️ No se generó contenido nuevo. No se publicará nada hoy.');
    fs.writeFileSync('daily-content.json', JSON.stringify({ fecha, total: 0, contenido: [] }, null, 2));
    return;
  }

  saveHistory(history);
  fs.writeFileSync('daily-content.json', JSON.stringify({
    fecha,
    generado_en: new Date().toISOString(),
    total: results.length,
    modo: MODO,
    contenido: results,
  }, null, 2));

  console.log(`\n✅ Contenido generado: ${results.length} video(s)`);
  results.forEach((r, i) => console.log(`  ${i + 1}. [${r._tipo_contenido.toUpperCase()}] ${r.gancho}`));
}

generateContent().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
