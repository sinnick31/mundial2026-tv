/**
 * generate-narration.js
 *
 * Genera narración en voz (locución estilo relator deportivo) usando
 * Gemini TTS — el mismo GEMINI_API_KEY que ya usas, sin secrets nuevos.
 *
 * Por qué esto importa: tus videos actuales son 100% silenciosos.
 * Un Short sin voz pierde retención frente a uno narrado. Esta narración
 * se inyecta directo en el render de Remotion (<Audio>), así que no hay
 * que mezclar nada después con ffmpeg.
 *
 * Uso como módulo:
 *   const { generarNarracion } = require('./generate-narration');
 *   const { audioPath, duracionSeg } = await generarNarracion(texto, 'out/audio.wav');
 *
 * Uso como CLI (debug):
 *   node scripts/generate-narration.js "Texto de prueba" out/test.wav
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TTS_MODEL = process.env.TTS_MODEL || 'gemini-2.5-flash-preview-tts';
// Voces disponibles (30 en total): Kore, Puck, Fenrir, Aoede, Charon, Leda...
// Puck/Fenrir suenan más enérgicas — buenas para relator deportivo.
// Pruébalas en Google AI Studio si quieres cambiar el tono.
const TTS_VOICE = process.env.TTS_VOICE || 'Puck';

const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

// ─── WAV header manual (sin dependencias externas) ───────────────────────────
function pcmToWav(pcmBuffer, sampleRate = SAMPLE_RATE, channels = CHANNELS, bitsPerSample = BITS_PER_SAMPLE) {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// ─── Llamada REST a Gemini TTS ────────────────────────────────────────────────
function callGeminiTTS(promptText) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICE } },
        },
      },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${TTS_MODEL}:generateContent`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message || 'Error Gemini TTS'));
          const part = json.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          if (!part?.data) return reject(new Error('Respuesta TTS sin audio (inlineData vacío)'));
          resolve(Buffer.from(part.data, 'base64'));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Genera el archivo de audio narrado a partir de un texto.
 * Si algo falla (cuota, red, etc.), NO tira el pipeline completo:
 * devuelve { audioPath: null, duracionSeg: null } y quien llama decide
 * el fallback (video sin audio, como hoy).
 */
async function generarNarracion(textoBase, outputPath, opciones = {}) {
  if (!GEMINI_API_KEY) {
    console.warn('   ⚠️ GEMINI_API_KEY no definido — narración omitida.');
    return { audioPath: null, duracionSeg: null };
  }

  const estilo = opciones.estilo
    || 'Narra esto con voz de relator deportivo de TV (estilo ESPN en español), tono enérgico, ritmo dinámico, sin exagerar:';
  const promptText = `${estilo}\n\n${textoBase}`;

  try {
    const pcm = await callGeminiTTS(promptText);
    const wav = pcmToWav(pcm);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, wav);

    const duracionSeg = pcm.length / (SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8));
    console.log(`   🔊 Narración generada: ${outputPath} (${duracionSeg.toFixed(1)}s)`);
    return { audioPath: outputPath, duracionSeg };
  } catch (err) {
    console.warn(`   ⚠️ No se pudo generar narración (${err.message}). Se renderiza sin audio.`);
    return { audioPath: null, duracionSeg: null };
  }
}

/**
 * Arma el texto a narrar a partir de un item de daily-content.json,
 * juntando gancho + descripción + puntos en un guion fluido (no lista leída).
 */
/**
 * Construye el guion de narración.
 * @param {object} item - Item de daily-content.json
 * @param {'completo'|'breve'} modo - 'breve' usa solo subtítulo + descripción + 1er punto
 *   (dato rápido ~20s); 'completo' incluye todos los puntos (análisis ~40-55s).
 *   Esto rompe el patrón de duración idéntica que penaliza YouTube.
 */
function construirGuion(item, modo = 'completo') {
  const partes = [item.subtitulo, item.descripcion];
  if (Array.isArray(item.puntos) && item.puntos.length > 0) {
    const puntos = modo === 'breve' ? item.puntos.slice(0, 1) : item.puntos;
    partes.push(puntos.join('. '));
  }
  return partes.filter(Boolean).join('. ');
}

module.exports = { generarNarracion, construirGuion, pcmToWav };

// ─── CLI de prueba ────────────────────────────────────────────────────────────
if (require.main === module) {
  const texto = process.argv[2] || 'Esta es una prueba de narración para Mundial 2026 TV.';
  const out = process.argv[3] || 'out/test-narracion.wav';
  generarNarracion(texto, out).then((r) => console.log(r));
}
