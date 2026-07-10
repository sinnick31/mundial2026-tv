/**
 * style-memory.js
 * Memoria de ESTILO del pipeline: guarda que ganchos, angulos y formatos
 * funcionan mejor (o peor) segun datos REALES de rendimiento de YouTube
 * (fetch-youtube-analytics.js), para que generate-daily-content.js ajuste
 * sus prompts con el tiempo.
 *
 * IMPORTANTE: este modulo solo guarda datos reales (metricas de YouTube
 * Analytics) o notas de estilo explicitas escritas a mano. Nunca debe
 * usarse para inventar resultados de partidos, declaraciones o noticias:
 * eso sigue viniendo unicamente de fetch-matches.js y fetch-news.js.
 *
 * El archivo style-memory.json vive en la raiz del repo y se commitea
 * automaticamente al final de cada ejecucion (ver workflow).
 */

const fs = require('fs');
const path = require('path');

const MEMORY_PATH = path.join(process.cwd(), 'style-memory.json');
const MAX_NOTES = 40; // evita que la lista de aprendizajes crezca infinito

function loadMemory() {
  if (!fs.existsSync(MEMORY_PATH)) {
    return {
      actualizado_en: null,
      patrones_alto_rendimiento: [],
      patrones_bajo_rendimiento: [],
      notas_estilo: [],
    };
  }
  try {
    const data = JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8'));
    return {
      actualizado_en: data.actualizado_en || null,
      patrones_alto_rendimiento: data.patrones_alto_rendimiento || [],
      patrones_bajo_rendimiento: data.patrones_bajo_rendimiento || [],
      notas_estilo: data.notas_estilo || [],
    };
  } catch {
    return {
      actualizado_en: null,
      patrones_alto_rendimiento: [],
      patrones_bajo_rendimiento: [],
      notas_estilo: [],
    };
  }
}

function saveMemory(memory) {
  memory.patrones_alto_rendimiento = memory.patrones_alto_rendimiento.slice(-MAX_NOTES);
  memory.patrones_bajo_rendimiento = memory.patrones_bajo_rendimiento.slice(-MAX_NOTES);
  memory.notas_estilo = memory.notas_estilo.slice(-MAX_NOTES);
  memory.actualizado_en = new Date().toISOString();
  fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));
}

/**
 * Registra una observacion basada en datos REALES de YouTube Analytics
 * (nunca en suposiciones). Debe llamarse solo desde
 * fetch-youtube-analytics.js con metricas reales del canal.
 */
function registrarPatron(memory, { gancho, tipoContenido, retencionPromedio, ctr, esBueno }) {
  const nota = {
    gancho,
    tipo_contenido: tipoContenido,
    retencion_promedio: retencionPromedio,
    ctr,
    fecha: new Date().toISOString(),
  };
  if (esBueno) memory.patrones_alto_rendimiento.push(nota);
  else memory.patrones_bajo_rendimiento.push(nota);
}

/**
 * Nota de estilo manual (por ejemplo una regla que el propio equipo del
 * canal quiera fijar a mano, no generada automaticamente a partir de
 * metricas).
 */
function agregarNotaManual(memory, nota) {
  memory.notas_estilo.push({ nota, fecha: new Date().toISOString() });
}

/**
 * Construye el bloque de texto que se inyecta en los prompts de Gemini,
 * resumiendo lo aprendido hasta ahora a partir de datos reales. Devuelve
 * cadena vacia si todavia no hay nada registrado.
 */
function buildStyleNotes(memory) {
  const bloques = [];

  if (memory.patrones_bajo_rendimiento.length) {
    const ultimos = memory.patrones_bajo_rendimiento.slice(-5)
      .map(p => `"${p.gancho}" (retencion real ${p.retencion_promedio ?? 'N/D'}%, CTR real ${p.ctr ?? 'N/D'}%)`);
    bloques.push(`Ganchos/angulos con BAJO rendimiento real reciente (datos de YouTube Analytics) - evita repetir este patron:\n${ultimos.join('\n')}`);
  }

  if (memory.patrones_alto_rendimiento.length) {
    const ultimos = memory.patrones_alto_rendimiento.slice(-5)
      .map(p => `"${p.gancho}" (retencion real ${p.retencion_promedio ?? 'N/D'}%, CTR real ${p.ctr ?? 'N/D'}%)`);
    bloques.push(`Ganchos/angulos con ALTO rendimiento real reciente (datos de YouTube Analytics) - favorece este tipo de estructura:\n${ultimos.join('\n')}`);
  }

  if (memory.notas_estilo.length) {
    bloques.push(`Notas de estilo fijadas manualmente por el equipo del canal:\n${memory.notas_estilo.slice(-5).map(n => `- ${n.nota}`).join('\n')}`);
  }

  return bloques.join('\n\n');
}

module.exports = {
  loadMemory,
  saveMemory,
  registrarPatron,
  agregarNotaManual,
  buildStyleNotes,
};
