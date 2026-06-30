/**
 * generate-daily-content.js (v2 — PROFESIONAL)
 *
 * Diferencias clave vs la versión anterior:
 *  1. Usa datos REALES de football-data.org (partidos jugados y por jugar)
 *  2. Nunca repite un partido ya cubierto (content-history.json)
 *  3. Nunca repite un ranking/noticia con el mismo enfoque (similitud de hook)
 *  4. Contenido tipo TV: narrativa, no "marcador pelado"
 *     - Partido YA JUGADO  → ángulo narrativo ("la jugada que nadie vio", "por qué avanzó")
 *     - Partido POR JUGARSE → predicción real con justificación
 *  5. Si no hay partidos nuevos disponibles, genera ranking/noticia ÚNICOS
 *     (nunca rellena con contenido duplicado solo para completar cupo)
 *
 * Resultado: menos videos, pero TODOS distintos entre sí.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const https = require('https');
const {
  loadHistory, saveHistory, hasMatch, hasSimilarHook, registrar,
} = require('./content-history');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const FOOTBALL_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const COMPETITION_ID = process.env.COMPETITION_ID || '2000'; // World Cup en football-data.org

// Cuántos videos como máximo intenta generar por ejecución.
// Calidad > cantidad: mejor 2-3 únicos que 10 repetidos.
const MAX_ITEMS = parseInt(process.env.MAX_ITEMS || '3', 10);

// ─── Cliente HTTP simple para football-data.org ──────────────────────────────

function fetchFootballData(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.football-data.org',
      path: `/v4${endpoint}`,
      headers: { 'X-Auth-Token': FOOTBALL_API_KEY },
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function getPartidosRecientes() {
  // Partidos finalizados en las últimas 48h
  const hoy = new Date();
  const hace2dias = new Date(hoy.getTime() - 2 * 24 * 60 * 60 * 1000);
  const dateFrom = hace2dias.toISOString().split('T')[0];
  const dateTo = hoy.toISOString().split('T')[0];

  try {
    const data = await fetchFootballData(
      `/competitions/${COMPETITION_ID}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&status=FINISHED`
    );
    return (data.matches || []).map(m => ({
      id: m.id,
      estado: 'finalizado',
      equipo1: m.homeTeam?.name || 'Equipo Local',
      equipo2: m.awayTeam?.name || 'Equipo Visitante',
      golesLocal: m.score?.fullTime?.home,
      golesVisita: m.score?.fullTime?.away,
      fase: m.stage,
      fecha: m.utcDate,
    }));
  } catch (err) {
    console.error('   ⚠️ Error obteniendo partidos recientes:', err.message);
    return [];
  }
}

async function getPartidosProximos() {
  // Partidos programados en las próximas 72h
  const hoy = new Date();
  const en3dias = new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000);
  const dateFrom = hoy.toISOString().split('T')[0];
  const dateTo = en3dias.toISOString().split('T')[0];

  try {
    const data = await fetchFootballData(
      `/competitions/${COMPETITION_ID}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}&status=SCHEDULED`
    );
    return (data.matches || []).map(m => ({
      id: m.id,
      estado: 'programado',
      equipo1: m.homeTeam?.name || 'Equipo Local',
      equipo2: m.awayTeam?.name || 'Equipo Visitante',
      fase: m.stage,
      fecha: m.utcDate,
    }));
  } catch (err) {
    console.error('   ⚠️ Error obteniendo próximos partidos:', err.message);
    return [];
  }
}

// ─── Prompts Gemini — estilo TV, no spoiler plano ────────────────────────────

function promptNarrativaPartido(partido) {
  return `
Eres guionista deportivo de televisión (estilo ESPN/Fox Sports) escribiendo para un Short de YouTube.

Partido YA JUGADO: ${partido.equipo1} ${partido.golesLocal}-${partido.golesVisita} ${partido.equipo2}
Fase: ${partido.fase}

PROHIBIDO: usar el marcador como gancho principal (eso ya lo sabe todo el mundo y no genera clicks).
OBLIGATORIO: crear un ángulo narrativo de TV real — una pregunta, un misterio, una jugada clave, un "por qué".

Ejemplos de buen ángulo (NO los copies, son solo referencia de estilo):
- "La jugada que nadie vio en el gol decisivo"
- "Por qué [equipo] nunca falla en este tipo de partidos"
- "El cambio táctico que nadie esperaba"

Responde SOLO con JSON, sin markdown:
{
  "tipo": "narrativa",
  "gancho": "ángulo narrativo en mayúsculas, máx 6 palabras, SIN marcador",
  "subtitulo": "frase que profundiza el gancho (máx 10 palabras)",
  "equipo1": "${partido.equipo1}",
  "equipo2": "${partido.equipo2}",
  "descripcion": "análisis narrativo de 2 frases que SÍ puede mencionar el resultado pero como contexto, no como gancho (máx 40 palabras)",
  "probabilidad": 0,
  "puntos": ["dato/análisis 1", "dato/análisis 2", "dato/análisis 3"],
  "emoji": "emoji relacionado",
  "titulo_youtube": "título tipo TV que NO revela el marcador en el título (máx 80 chars)",
  "descripcion_youtube": "descripción con hashtags (3 párrafos)",
  "tags": ["tag1","tag2","tag3","tag4","tag5"]
}
`;
}

function promptPrediccionPartido(partido) {
  return `
Eres analista deportivo de televisión generando una predicción REAL antes de un partido del Mundial 2026.

Partido POR JUGARSE: ${partido.equipo1} vs ${partido.equipo2}
Fase: ${partido.fase}
Fecha: ${partido.fecha}

Genera una predicción concreta, justificada y polémica (no genérica). Responde SOLO con JSON, sin markdown:
{
  "tipo": "eliminacion" | "campeon" | "sorpresa" | "fracaso",
  "gancho": "texto en mayúsculas muy corto (máx 5 palabras) que genere shock o intriga",
  "subtitulo": "frase que explica el gancho (máx 10 palabras)",
  "equipo1": "${partido.equipo1}",
  "equipo2": "${partido.equipo2}",
  "descripcion": "predicción concreta en 2 frases (máx 40 palabras)",
  "probabilidad": número entre 10 y 95,
  "puntos": ["razón táctica 1", "razón táctica 2", "razón táctica 3"],
  "emoji": "emoji relacionado",
  "titulo_youtube": "título optimizado, debe sonar a predicción ANTES del partido (máx 80 chars)",
  "descripcion_youtube": "descripción con hashtags (3 párrafos)",
  "tags": ["tag1","tag2","tag3","tag4","tag5"]
}
`;
}

function promptRanking(temasEvitar) {
  return `
Eres analista de TV deportiva generando un ranking viral sobre el Mundial 2026.

IMPORTANTE: NO repitas ninguno de estos enfoques ya usados antes: ${temasEvitar.join(' | ') || 'ninguno aún'}
Elegí un ángulo de ranking completamente distinto y específico (ej: peores arbitrajes, mejores remontadas, jugadores revelación, defensas más sólidas, etc — sé creativo y específico, no genérico).

Responde SOLO con JSON, sin markdown:
{
  "tipo": "sorpresa",
  "gancho": "nombre del ranking en mayúsculas (máx 5 palabras)",
  "subtitulo": "subtítulo explicativo (máx 8 palabras)",
  "equipo1": "Ranking",
  "equipo2": null,
  "descripcion": "criterio del ranking (máx 30 palabras)",
  "probabilidad": 75,
  "puntos": ["#1: ...", "#2: ...", "#3: ...", "#4: ...", "#5: ..."],
  "emoji": "emoji temático",
  "titulo_youtube": "título YouTube optimizado",
  "descripcion_youtube": "descripción con hashtags (3 párrafos)",
  "tags": ["tag1","tag2","tag3","tag4","tag5"]
}
`;
}

// ─── Llamada a Gemini con limpieza de respuesta ──────────────────────────────

async function llamarGemini(model, prompt) {
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
}

// ─── Pipeline principal ───────────────────────────────────────────────────────

async function generateContent() {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const history = loadHistory();
  const fecha = new Date().toISOString().split('T')[0];
  const results = [];

  console.log('📡 Consultando partidos del Mundial 2026...\n');
  const [recientes, proximos] = await Promise.all([
    getPartidosRecientes(),
    getPartidosProximos(),
  ]);

  // Filtrar partidos que YA cubrimos antes (anti-duplicado por match_id)
  const recientesNuevos = recientes.filter(p => !hasMatch(history, p.id));
  const proximosNuevos = proximos.filter(p => !hasMatch(history, p.id));

  console.log(`   ${recientes.length} partidos recientes (${recientesNuevos.length} sin cubrir)`);
  console.log(`   ${proximos.length} próximos partidos (${proximosNuevos.length} sin cubrir)\n`);

  // ─── 1. Priorizar partidos NUEVOS (recientes con narrativa, próximos con predicción) ──
  const candidatosPartido = [
    ...recientesNuevos.map(p => ({ partido: p, modo: 'narrativa' })),
    ...proximosNuevos.map(p => ({ partido: p, modo: 'prediccion' })),
  ].slice(0, MAX_ITEMS);

  for (const { partido, modo } of candidatosPartido) {
    const label = `${modo === 'narrativa' ? 'Narrativa' : 'Predicción'}: ${partido.equipo1} vs ${partido.equipo2}`;
    console.log(`⚙️  Generando: ${label}...`);
    try {
      const prompt = modo === 'narrativa'
        ? promptNarrativaPartido(partido)
        : promptPrediccionPartido(partido);
      const data = await llamarGemini(model, prompt);

      results.push({
        ...data,
        _tipo_contenido: modo,
        _match_id: partido.id,
        _label: label,
        _fecha: fecha,
        _orden: results.length + 1,
      });
      registrar(history, {
        matchId: partido.id,
        tipoContenido: modo,
        hook: data.gancho,
        titulo: data.titulo_youtube,
      });
      console.log(`   ✅ ${data.gancho}`);
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }

  // ─── 2. Si quedan cupos, completar con ranking ÚNICO (nunca duplicado) ────
  const huecosRestantes = MAX_ITEMS - results.length;
  if (huecosRestantes > 0) {
    console.log(`\n⚙️  Generando ${huecosRestantes} ranking(s) único(s)...`);
    const temasUsados = history.items
      .filter(i => i.tipo_contenido === 'ranking')
      .slice(-10)
      .map(i => i.hook);

    for (let i = 0; i < huecosRestantes; i++) {
      try {
        const prompt = promptRanking(temasUsados);
        const data = await llamarGemini(model, prompt);

        // Chequeo extra de similitud antes de aceptar
        if (hasSimilarHook(history, data.gancho, 'ranking')) {
          console.log(`   ⚠️ Ranking demasiado similar a uno previo, se descarta: ${data.gancho}`);
          continue;
        }

        results.push({
          ...data,
          _tipo_contenido: 'ranking',
          _match_id: null,
          _label: `Ranking: ${data.gancho}`,
          _fecha: fecha,
          _orden: results.length + 1,
        });
        registrar(history, {
          matchId: null,
          tipoContenido: 'ranking',
          hook: data.gancho,
          titulo: data.titulo_youtube,
        });
        temasUsados.push(data.gancho);
        console.log(`   ✅ ${data.gancho}`);
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        console.error(`   ❌ Error generando ranking: ${err.message}`);
      }
    }
  }

  // ─── Guardar resultados + historial actualizado ──────────────────────────
  if (results.length === 0) {
    console.log('\n⚠️ No se generó contenido nuevo (todo ya estaba cubierto). No se publicará nada hoy.');
    fs.writeFileSync('daily-content.json', JSON.stringify({ fecha, total: 0, contenido: [] }, null, 2));
    return;
  }

  saveHistory(history);
  fs.writeFileSync('daily-content.json', JSON.stringify({
    fecha,
    generado_en: new Date().toISOString(),
    total: results.length,
    contenido: results,
  }, null, 2));

  console.log(`\n✅ Contenido ÚNICO generado: ${results.length} video(s)`);
  results.forEach((r, i) => console.log(`   ${i + 1}. [${r._tipo_contenido.toUpperCase()}] ${r.gancho}`));
}

generateContent().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
