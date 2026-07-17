/**
 * generate-daily-content.js — FOOTBALL AI STUDIO v4.0
 *
 * Mejoras v4 vs v3:
 * 1. Ya NO depende del Mundial 2026 — cubre TODO el fútbol 365 días al año
 * 2. 🇨🇱 Fútbol chileno con prioridad alta (ventaja competitiva del canal)
 * 3. Motor VIRAL SCORE: solo se producen las noticias con mayor potencial
 * 4. Prompts genéricos multi-competición (Champions, Primera A, Libertadores...)
 * 5. Hashtags y SEO dinámicos según la competencia de cada video
 * 6. Modos: auto | noticias | partidos | predicciones | ranking | chile | fichajes
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const https = require('https');
const {
  loadHistory, saveHistory, hasMatch, hasSimilarHook, registrar,
} = require('./content-history');
const { appendAffiliateFooter } = require('./affiliate-links');
const { seleccionarTop } = require('./viral-score');

// Etiqueta de competencia para inyectar en prompts (v4: multi-competición)
function ctxCompetencia(partido) {
  return partido.competencia || 'Fútbol internacional';
}
function hashtagCompetencia(partido) {
  return (partido && partido.hashtag) || '#Futbol';
}

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

// ─── Reglas anti-clickbait compartidas por todos los prompts ─────────────────
const REGLAS_TITULO = `REGLAS ESTRICTAS PARA titulo_youtube (YouTube penaliza el clickbait genérico):
- PROHIBIDO usar: "BOMBAZO", "INCREÍBLE", "IMPACTANTE", "NO LO VAS A CREER", "SHOCK", "AL LÍMITE"
- PROHIBIDO más de 1 signo de exclamación y más de 1 emoji en el título
- OBLIGATORIO: el título debe contener UN DATO CONCRETO Y VERIFICABLE (minuto, marcador, estadística, nombre de jugador) seguido de una pregunta o ángulo específico
- Formato ejemplo: "España tardó 78 min en marcar a Austria: ¿problema táctico?" o "Kane suma 4 goles en 3 partidos: los números detrás"
- El título debe poder verificarse contra los datos reales que te entregué arriba. NO inventes cifras.`;

const REGLAS_DESCRIPCION = `REGLAS PARA descripcion_youtube:
- El primer párrafo resume el dato/hecho real
- El segundo párrafo da contexto o análisis
- El tercer párrafo incluye los hashtags
- NO inventes estadísticas que no estén en los datos entregados`;

function promptNarrativaPartido(partido) {
  const golInfo = partido.goleadores ? `\nGoleadores: ${JSON.stringify(partido.goleadores)}` : '';
  return `Eres guionista deportivo de TV (ESPN/Fox Sports) para un Short de YouTube sobre un partido REAL ya jugado.

DATOS REALES DEL PARTIDO (única fuente permitida — no inventes nada fuera de esto):
Resultado FINAL: ${partido.equipo1} ${partido.golesLocal}-${partido.golesVisita} ${partido.equipo2}
Competencia: ${ctxCompetencia(partido)} | Fase: ${partido.fase}
Fecha: ${partido.fecha || 'reciente'}${golInfo}

REGLA DE GANCHO: NO uses el marcador como gancho. Crea un ángulo narrativo de TV (la jugada clave, el misterio táctico, por qué ganó quien ganó), pero SIEMPRE anclado en los datos reales de arriba.

${REGLAS_TITULO}

${REGLAS_DESCRIPCION}

Responde SOLO con JSON válido sin markdown:
{
  "tipo": "narrativa",
  "gancho": "ángulo narrativo en MAYÚSCULAS máx 6 palabras SIN marcador",
  "subtitulo": "frase que profundiza el gancho máx 10 palabras",
  "equipo1": "${partido.equipo1}",
  "equipo2": "${partido.equipo2}",
  "descripcion": "análisis narrativo 2 frases máx 40 palabras basado en el resultado real",
  "probabilidad": 0,
  "puntos": ["dato real 1 (con cifra)", "dato real 2 (con cifra)", "análisis basado en los datos"],
  "emoji": "emoji relacionado",
  "titulo_youtube": "dato real + pregunta, máx 80 chars, siguiendo las reglas estrictas",
  "descripcion_youtube": "descripción de 3 párrafos siguiendo las reglas ${hashtagCompetencia(partido)} #Futbol #Shorts",
  "tags": ["tag1","tag2","tag3","tag4","tag5"]
}`;
}

function promptPrediccionPartido(partido, contexto = {}) {
  const { resultadosRecientes = [], tabla = [] } = contexto;

  // Filtrar contexto relevante a los dos equipos del partido
  const relevante = (nombre) => (p) =>
    [p.equipo1, p.equipo2].some(e => e && nombre && (e.includes(nombre) || nombre.includes(e)));
  const historialE1 = resultadosRecientes.filter(relevante(partido.equipo1)).slice(0, 3);
  const historialE2 = resultadosRecientes.filter(relevante(partido.equipo2)).slice(0, 3);

  const datosContexto = [];
  if (historialE1.length) datosContexto.push(`Resultados recientes de ${partido.equipo1}: ${historialE1.map(p => `${p.equipo1} ${p.golesLocal}-${p.golesVisita} ${p.equipo2}`).join(' | ')}`);
  if (historialE2.length) datosContexto.push(`Resultados recientes de ${partido.equipo2}: ${historialE2.map(p => `${p.equipo1} ${p.golesLocal}-${p.golesVisita} ${p.equipo2}`).join(' | ')}`);
  if (tabla.length) datosContexto.push(`Tabla de posiciones (resumen): ${JSON.stringify(tabla.slice(0, 8))}`);

  return `Eres analista deportivo de TV generando un ANÁLISIS PREVIO (no una predicción sensacionalista) de un partido de fútbol.

Partido PRÓXIMO: ${partido.equipo1} vs ${partido.equipo2}
Competencia: ${ctxCompetencia(partido)} | Fase: ${partido.fase}
Fecha: ${partido.fecha}

DATOS REALES DISPONIBLES (basa TODO tu análisis en esto):
${datosContexto.length ? datosContexto.join('\n') : 'Sin datos de contexto — en ese caso limita el análisis a la fase del torneo y NO inventes estadísticas.'}

REGLAS DEL ANÁLISIS:
- Cada punto DEBE citar una cifra o hecho de los datos de arriba
- PROHIBIDO afirmar eliminaciones como hechos ("X ELIMINADO"). Presenta escenarios con probabilidad
- La probabilidad debe ser coherente con los datos, no siempre 75

${REGLAS_TITULO}

${REGLAS_DESCRIPCION}

Responde SOLO con JSON válido sin markdown:
{
  "tipo": "sorpresa",
  "gancho": "ángulo de análisis MAYÚSCULAS máx 5 palabras (sin afirmar resultados)",
  "subtitulo": "frase explicativa máx 10 palabras",
  "equipo1": "${partido.equipo1}",
  "equipo2": "${partido.equipo2}",
  "descripcion": "análisis previo concreto 2 frases máx 40 palabras",
  "probabilidad": 60,
  "puntos": ["dato real + implicancia 1", "dato real + implicancia 2", "dato real + implicancia 3"],
  "emoji": "emoji relacionado",
  "titulo_youtube": "dato real + pregunta sobre el partido próximo, máx 80 chars",
  "descripcion_youtube": "descripción de 3 párrafos siguiendo las reglas ${hashtagCompetencia(partido)} #Futbol #Shorts",
  "tags": ["tag1","tag2","tag3","tag4","tag5"]
}`;
}

function promptNoticiaDia(noticia) {
  const esChile = noticia.categoria === 'chile' || noticia.equipo_chile;
  const contextoCategoria = esChile
    ? `Esta es una noticia del FÚTBOL CHILENO${noticia.equipo_chile ? ` sobre ${noticia.equipo_chile}` : ''}. El público objetivo son hinchas chilenos: usa referencias locales (Primera División, Copa Chile, La Roja) y un tono cercano al hincha chileno.`
    : noticia.categoria === 'fichajes'
      ? 'Esta es una noticia de MERCADO DE FICHAJES. Enfoca el ángulo en las cifras, el impacto en el equipo y lo que significa para la próxima temporada.'
      : 'Esta es una noticia del fútbol internacional. Contextualiza para audiencia hispanohablante de Latinoamérica.';
  const hashtags = esChile ? '#FutbolChileno #PrimeraDivision' : noticia.categoria === 'fichajes' ? '#Fichajes #MercadoDePases' : '#Futbol';
  return `Eres editor de noticias deportivas para YouTube Shorts. Debes convertir esta noticia real del día en un Short viral.

NOTICIA REAL: "${noticia.title}"
FUENTE: ${noticia.fuente || 'Prensa deportiva'}
RESUMEN: ${noticia.description || ''}

${contextoCategoria}
La descripcion_youtube DEBE mencionar la fuente ("Según ${noticia.fuente || 'la prensa deportiva'}...") e incluir estos hashtags: ${hashtags} #Shorts.

${REGLAS_TITULO}

${REGLAS_DESCRIPCION}

Responde SOLO con JSON válido sin markdown:
{
  "tipo": "sorpresa",
  "gancho": "titular en MAYÚSCULAS máx 6 palabras fiel a la noticia real",
  "subtitulo": "contexto que amplía la noticia máx 10 palabras",
  "equipo1": "País o equipo principal de la noticia",
  "equipo2": null,
  "descripcion": "análisis de la noticia en 2 frases máx 40 palabras",
  "probabilidad": 80,
  "puntos": ["dato clave 1", "dato clave 2", "impacto para el equipo/torneo"],
  "emoji": "emoji temático",
  "titulo_youtube": "dato de la noticia + ángulo específico, máx 80 chars",
  "descripcion_youtube": "descripción de 3 párrafos citando la fuente con los hashtags indicados",
  "tags": ["tag1","tag2","tag3","tag4","tag5"]
}`;
}

function promptRanking(temasEvitar, contexto = {}) {
  const { resultadosRecientes = [], tabla = [] } = contexto;
  const datos = [];
  if (resultadosRecientes.length) datos.push(`Resultados reales recientes: ${resultadosRecientes.slice(0, 8).map(p => `[${p.competencia || 'Fútbol'}] ${p.equipo1} ${p.golesLocal}-${p.golesVisita} ${p.equipo2}`).join(' | ')}`);
  if (tabla.length) datos.push(`Tabla de posiciones real: ${JSON.stringify(tabla.slice(0, 10))}`);

  return `Eres analista de TV deportiva generando un ranking de fútbol BASADO EN DATOS REALES (usa la competencia que aparezca en los datos: Champions, Premier, Primera División de Chile, etc.).

DATOS REALES DISPONIBLES (el ranking DEBE derivarse de estas cifras — cada posición debe incluir el número que la justifica):
${datos.length ? datos.join('\n') : 'ATENCIÓN: no hay datos reales disponibles hoy. En ese caso responde exactamente {"sin_datos": true} y nada más.'}

NO repitas estos enfoques ya usados: ${temasEvitar.join(' | ') || 'ninguno aún'}

${REGLAS_TITULO}

${REGLAS_DESCRIPCION}

Elige un ángulo ORIGINAL y ESPECÍFICO derivado de los datos. Responde SOLO con JSON válido sin markdown:
{
  "tipo": "sorpresa",
  "gancho": "nombre del ranking MAYÚSCULAS máx 5 palabras",
  "subtitulo": "subtítulo explicativo máx 8 palabras",
  "equipo1": "Ranking",
  "equipo2": null,
  "descripcion": "criterio del ranking máx 30 palabras",
  "probabilidad": 75,
  "puntos": ["#1: equipo/jugador — cifra real", "#2: ... — cifra real", "#3: ... — cifra real", "#4: ... — cifra real", "#5: ... — cifra real"],
  "emoji": "emoji temático",
  "titulo_youtube": "título YouTube optimizado máx 80 chars",
  "descripcion_youtube": "descripción con hashtags 3 párrafos #Futbol #Ranking #Shorts",
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

// ─── Sanitización anti-clickbait (garantía a nivel de código) ─────────────────
// Aunque el prompt lo prohíbe, si Gemini igual devuelve clickbait, se limpia acá.

const PALABRAS_PROHIBIDAS = /(¡?BOMBAZO!?|INCRE[IÍ]BLE|IMPACTANTE|NO LO VAS A CREER|SHOCK(EANTE)?|AL L[IÍ]MITE)[:\s]*/gi;

function sanitizarTitulo(titulo) {
  if (!titulo) return titulo;
  let t = String(titulo)
    .replace(PALABRAS_PROHIBIDAS, '')
    .replace(/[¡!]{2,}/g, '')        // pares/rachas de exclamación huérfanas
    .replace(/\?{2,}/g, '?')
    .replace(/^[\s¡!:,.\-–]+/, '')   // puntuación huérfana al inicio
    .replace(/\s+([?!,.])/g, '$1')   // espacio antes de puntuación
    .replace(/¡\s*\?/g, '¿')         // "¡ ?" residual
    .replace(/\s{2,}/g, ' ')
    .trim();
  // Máximo 1 emoji en el título
  const emojis = t.match(/\p{Extended_Pictographic}/gu) || [];
  if (emojis.length > 1) {
    let visto = 0;
    t = t.replace(/\p{Extended_Pictographic}/gu, (m) => (++visto === 1 ? m : ''));
    t = t.replace(/\s{2,}/g, ' ').trim();
  }
  return t.substring(0, 100);
}

function footerFuentes(item, fecha) {
  const fuentes = ['football-data.org', 'ESPN'];
  if (item._fuente) fuentes.unshift(item._fuente);
  return `\n\n📊 Fuentes: ${[...new Set(fuentes)].join(' · ')} — datos al ${fecha}.`;
}

// Aplica sanitización + fuentes a un item ya generado
function pulirItem(item, fecha) {
  item.titulo_youtube = sanitizarTitulo(item.titulo_youtube);
  item.gancho = sanitizarTitulo(item.gancho);
  if (item.descripcion_youtube && !item.descripcion_youtube.includes('📊 Fuentes:')) {
    item.descripcion_youtube = item.descripcion_youtube.trim() + footerFuentes(item, fecha);
  }
  item.descripcion_youtube = appendAffiliateFooter(item.descripcion_youtube);
  return item;
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

  // Contexto de datos reales que se inyecta a los prompts de predicción y ranking
  const contextoDatos = {
    resultadosRecientes: recientes,
    tabla: matchesCache.tabla_posiciones || [],
  };

  // ─── Prioridad según MODO ──────────────────────────────────────────────────
  // ORDEN NUEVO (SEO): 1º resultados reales jugados (lo que la gente busca),
  // 2º noticias del día, 3º análisis previo de próximos (máx 1, al final).
  // Antes las predicciones iban primero → generaba el catálogo de "BOMBAZOS"
  // especulativos que YouTube no distribuye.
  const queue = [];

  // 1. Partidos recientes con narrativa — MÁXIMA PRIORIDAD (contenido con búsqueda real)
  if (MODO === 'auto' || MODO === 'partidos') {
    // v4: ya vienen ordenados por prioridad (Chile > Champions > resto)
    recientesNuevos.slice(0, 3).forEach(p => queue.push({ tipo: 'narrativa', data: p }));
  }

  // 2. Partidos en curso (marcador en vivo real, no especulación)
  if (enCurso.length > 0 && !['noticias', 'ranking', 'chile', 'fichajes'].includes(MODO)) {
    enCurso.slice(0, 1).forEach(p => queue.push({ tipo: 'prediccion', data: p }));
  }

  // 3. Noticias del día — v4: seleccionadas por VIRAL SCORE, con cupo
  //    garantizado para fútbol chileno (ventaja competitiva del canal)
  if (MODO === 'auto' || MODO === 'noticias' || MODO === 'chile' || MODO === 'fichajes') {
    const candidatas = noticiasHoy.filter(n => !hasSimilarHook(history, n.title, 'noticia'));

    let seleccion;
    if (MODO === 'chile') {
      seleccion = seleccionarTop(candidatas.filter(n => n.categoria === 'chile' || n.equipo_chile), { top: 4, umbral: 30 });
    } else if (MODO === 'fichajes') {
      seleccion = seleccionarTop(candidatas.filter(n => n.categoria === 'fichajes'), { top: 4, umbral: 30 });
    } else {
      // auto/noticias: top viral general + mínimo 1 chilena si existe
      const topGeneral = seleccionarTop(candidatas, { top: 3, umbral: 40 });
      const hayChilena = topGeneral.some(n => n.categoria === 'chile' || n.equipo_chile);
      if (!hayChilena) {
        const mejorChilena = seleccionarTop(candidatas.filter(n => n.categoria === 'chile' || n.equipo_chile), { top: 1, umbral: 30 });
        if (mejorChilena.length) topGeneral.splice(Math.min(1, topGeneral.length), 0, mejorChilena[0]);
      }
      seleccion = topGeneral.slice(0, 3);
    }

    seleccion.forEach(n => {
      console.log(`  🎯 Noticia seleccionada [score ${n.viral?.score ?? n.viral_score ?? '?'}] [${n.categoria}]: ${n.title.substring(0, 70)}`);
      queue.push({ tipo: 'noticia', data: n });
    });
  }

  // 4. Análisis previo del próximo partido — máx 1 y al final de la cola
  if (MODO === 'auto' || MODO === 'predicciones') {
    const limite = MODO === 'predicciones' ? 2 : 1;
    proximosNuevos.slice(0, limite).forEach(p => queue.push({ tipo: 'prediccion', data: p }));
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
        data = pulirItem(await llamarGemini(model, prompt), fecha);
        registrar(history, { matchId: item.data.id, tipoContenido: 'narrativa', hook: data.gancho, titulo: data.titulo_youtube });
        results.push({ ...data, _tipo_contenido: 'narrativa', _match_id: item.data.id, _goles_local: item.data.golesLocal, _goles_visita: item.data.golesVisita, _fase: item.data.fase, _label: label, _fecha: fecha, _orden: results.length + 1 });
      } else if (item.tipo === 'prediccion') {
        prompt = promptPrediccionPartido(item.data, contextoDatos);
        data = pulirItem(await llamarGemini(model, prompt), fecha);
        registrar(history, { matchId: item.data.id, tipoContenido: 'prediccion', hook: data.gancho, titulo: data.titulo_youtube });
        results.push({ ...data, _tipo_contenido: 'prediccion', _match_id: item.data.id, _fase: item.data.fase, _label: label, _fecha: fecha, _orden: results.length + 1 });
      } else if (item.tipo === 'noticia') {
        prompt = promptNoticiaDia(item.data);
        data = pulirItem({ ...(await llamarGemini(model, prompt)), _fuente: item.data.fuente }, fecha);
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
          const data = await llamarGemini(model, promptRanking(temasUsados, contextoDatos));
          if (data.sin_datos) {
            console.log('  ⚠️ Sin datos reales para rankings hoy — se omite (mejor no publicar que inventar).');
            break;
          }
          pulirItem(data, fecha);
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
