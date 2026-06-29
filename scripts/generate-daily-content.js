/**
 * generate-daily-content.js
 * Llama a Gemini para generar 4 predicciones/rankings/noticias del día
 * y guarda los datos en daily-content.json para que el render los lea
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Templates de prompt por tipo ───────────────────────────────────────────

const PROMPTS = {
  prediccion: (contexto) => `
Eres un experto en fútbol y análisis del Mundial 2026 que genera contenido viral para YouTube Shorts.
Contexto del torneo: ${contexto}

Genera UNA predicción polémica y viral en formato JSON exacto. No incluyas \`\`\`json ni markdown, solo el JSON.

{
  "tipo": "eliminacion" | "campeon" | "sorpresa" | "fracaso",
  "gancho": "texto en mayúsculas muy corto (máx 4 palabras) que genere shock. Ejemplo: ¡ARGENTINA ELIMINADA!",
  "subtitulo": "frase que explica el gancho (máx 10 palabras)",
  "equipo1": "nombre del equipo principal",
  "equipo2": "nombre del segundo equipo (si aplica, sino null)",
  "descripcion": "predicción concreta y polémica en 2 frases (máx 40 palabras)",
  "probabilidad": número entre 10 y 95,
  "puntos": ["razón 1 corta", "razón 2 corta", "razón 3 corta"],
  "emoji": "un emoji relacionado",
  "titulo_youtube": "título optimizado para YouTube (máx 80 chars, con palabras clave)",
  "descripcion_youtube": "descripción para YouTube con hashtags del Mundial 2026 (3 párrafos)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

REGLAS:
- El gancho DEBE generar controversia o sorpresa
- El equipo protagonista debe ser relevante (top 16 del mundo)
- La predicción debe ser específica (no genérica)
- Usa datos reales cuando sea posible
`,

  ranking: (contexto) => `
Eres un experto en fútbol y análisis del Mundial 2026 que genera contenido viral para YouTube Shorts.
Contexto del torneo: ${contexto}

Genera UN ranking polémico en formato JSON exacto. No incluyas \`\`\`json ni markdown, solo el JSON.

{
  "tipo": "sorpresa",
  "gancho": "texto del ranking en mayúsculas (máx 4 palabras). Ejemplo: TOP 5 FAVORITOS",
  "subtitulo": "subtítulo explicativo (máx 8 palabras)",
  "equipo1": "Ranking",
  "equipo2": null,
  "descripcion": "descripción del criterio del ranking (máx 30 palabras)",
  "probabilidad": 75,
  "puntos": ["#1: equipo/jugador + razón corta", "#2: ...", "#3: ...", "#4: ...", "#5: ..."],
  "emoji": "emoji temático",
  "titulo_youtube": "título YouTube optimizado",
  "descripcion_youtube": "descripción con hashtags (3 párrafos)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

El ranking DEBE incluir al menos una elección sorpresiva o polémica.
`,

  noticia: (contexto) => `
Eres un experto en fútbol y noticias del Mundial 2026 para YouTube Shorts.
Contexto actual: ${contexto}

Genera UNA noticia viral en formato JSON exacto. No incluyas \`\`\`json ni markdown, solo el JSON.

{
  "tipo": "sorpresa",
  "gancho": "ÚLTIMA HORA: + 3 palabras impactantes",
  "subtitulo": "explicación rápida de la noticia (máx 10 palabras)",
  "equipo1": "equipo/jugador protagonista",
  "equipo2": null,
  "descripcion": "contexto de la noticia en 2 frases concretas (máx 35 palabras)",
  "probabilidad": 88,
  "puntos": ["impacto 1", "impacto 2", "impacto 3"],
  "emoji": "emoji de urgencia",
  "titulo_youtube": "título urgente optimizado",
  "descripcion_youtube": "descripción con hashtags (3 párrafos)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

La noticia debe sonar urgente e importante para el Mundial 2026.
`,
};

// ─── Contexto del Mundial 2026 ────────────────────────────────────────────────

const CONTEXTO_MUNDIAL = `
Mundial 2026 en USA, México y Canadá.
Fechas: 11 junio - 19 julio 2026.
48 equipos participantes.
Favoritos actuales: Francia, Brasil, Argentina, España, Inglaterra.
Sorpresas posibles: Marruecos, Portugal, Países Bajos.
Grupos confirmados. Fase de grupos en curso.
Chile no clasificó. Ecuador y Uruguay son los representantes sudamericanos principales.
Messi y Cristiano en sus últimos Mundiales.
`;

// ─── Función principal ────────────────────────────────────────────────────────

async function generateContent() {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const results = [];
  const fecha = new Date().toISOString().split('T')[0];

  const tareas = [
    { tipo: 'prediccion', label: 'Predicción 1' },
    { tipo: 'prediccion', label: 'Predicción 2' },
    { tipo: 'ranking',    label: 'Ranking del día' },
    { tipo: 'noticia',    label: 'Noticia viral' },
  ];

  for (const tarea of tareas) {
    console.log(`\n⚙️  Generando: ${tarea.label}...`);
    try {
      const prompt = PROMPTS[tarea.tipo](CONTEXTO_MUNDIAL);
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      // Limpiar posibles bloques markdown
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data = JSON.parse(cleanText);

      results.push({
        ...data,
        _tipo_contenido: tarea.tipo,
        _label: tarea.label,
        _fecha: fecha,
        _orden: results.length + 1,
      });

      console.log(`   ✅ ${data.gancho}`);

      // Pequeño delay para no saturar la API
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`   ❌ Error en ${tarea.label}:`, err.message);
      // Generar contenido de fallback
      results.push(getFallback(tarea.tipo, fecha, results.length + 1));
    }
  }

  // Guardar resultados
  const output = {
    fecha,
    generado_en: new Date().toISOString(),
    total: results.length,
    contenido: results,
  };

  fs.writeFileSync('daily-content.json', JSON.stringify(output, null, 2));
  console.log(`\n✅ Contenido generado: daily-content.json (${results.length} videos)`);
  console.log('\n📋 Resumen:');
  results.forEach((r, i) => console.log(`   ${i+1}. [${r._tipo_contenido.toUpperCase()}] ${r.gancho}`));
}

// ─── Fallbacks si Gemini falla ────────────────────────────────────────────────

function getFallback(tipo, fecha, orden) {
  const fallbacks = {
    prediccion: {
      tipo: 'sorpresa',
      gancho: '¡NADIE LO ESPERABA!',
      subtitulo: 'La IA predice el resultado más sorprendente del Mundial 2026',
      equipo1: 'Brasil',
      equipo2: 'Francia',
      descripcion: 'La inteligencia artificial predice una de las mayores sorpresas en la historia del fútbol mundial.',
      probabilidad: 34,
      puntos: ['Rendimiento irregular en fase de grupos', 'Lesiones en jugadores clave', 'Factor local favorece al rival'],
      emoji: '⚽',
      titulo_youtube: '¡INCREÍBLE! La IA predice la mayor sorpresa del Mundial 2026 #Shorts',
      descripcion_youtube: '🤖 La inteligencia artificial ha analizado todos los datos del Mundial 2026...\n\n¿Crees que esto pasará? Escribe SI o NO en los comentarios 👇\n\n#Mundial2026 #Prediccion #Futbol #Shorts #IA',
      tags: ['Mundial2026', 'Prediccion', 'Futbol', 'Shorts', 'IA'],
    },
    ranking: {
      tipo: 'sorpresa',
      gancho: 'TOP 5 FAVORITOS',
      subtitulo: 'Los equipos que la IA da como favoritos al título',
      equipo1: 'Rankings',
      equipo2: null,
      descripcion: 'La inteligencia artificial ha analizado las estadísticas y determina los 5 grandes favoritos del Mundial 2026.',
      probabilidad: 75,
      puntos: ['#1: Francia — máxima potencia europea', '#2: Brasil — favoritismo histórico', '#3: Argentina — campeón vigente', '#4: España — fútbol total', '#5: Inglaterra — momento histórico'],
      emoji: '🏆',
      titulo_youtube: 'TOP 5 FAVORITOS para ganar el Mundial 2026 según la IA #Shorts',
      descripcion_youtube: '🏆 La IA analiza los 5 equipos con más posibilidades de ser campeón...\n\n¿Falta alguno? Escríbelo en los comentarios 👇\n\n#Mundial2026 #Top5 #Futbol #Shorts',
      tags: ['Mundial2026', 'Top5', 'Favoritos', 'Futbol', 'Shorts'],
    },
    noticia: {
      tipo: 'sorpresa',
      gancho: 'ÚLTIMA HORA: BOMBA',
      subtitulo: 'Esto acaba de cambiar el Mundial 2026',
      equipo1: 'Mundial 2026',
      equipo2: null,
      descripcion: 'Una noticia acaba de sacudir el torneo y podría cambiar completamente el panorama del Mundial 2026.',
      probabilidad: 88,
      puntos: ['Impacto directo en el favorito', 'Consecuencias para la fase eliminatoria', 'La IA recalcula sus predicciones'],
      emoji: '🚨',
      titulo_youtube: '🚨 ÚLTIMA HORA: Noticia bomba que cambia el Mundial 2026 #Shorts',
      descripcion_youtube: '🚨 Esto acaba de ocurrir y nadie lo esperaba...\n\n¿Qué opinas? Escribe en los comentarios 👇\n\n#Mundial2026 #UltimaHora #Futbol #Shorts',
      tags: ['Mundial2026', 'UltimaHora', 'Noticias', 'Futbol', 'Shorts'],
    },
  };

  return {
    ...fallbacks[tipo],
    _tipo_contenido: tipo,
    _label: `Fallback ${tipo}`,
    _fecha: fecha,
    _orden: orden,
  };
}

generateContent().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
