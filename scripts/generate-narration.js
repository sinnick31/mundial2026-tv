/**
 * generate-narration.js
 *
 * Genera narración en voz usando Gemini TTS. La narración parte del paquete
 * editorial source-locked y usa una voz dinámica, pero nunca añade hechos
 * que no estén presentes en los datos de entrada.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TTS_MODEL = process.env.TTS_MODEL || 'gemini-2.5-flash-preview-tts';
const TTS_VOICE = process.env.TTS_VOICE || 'Puck';
const SAMPLE_RATE = 24000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;

function pcmToWav(pcmBuffer, sampleRate = SAMPLE_RATE, channels = CHANNELS, bitsPerSample = BITS_PER_SAMPLE) {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
}

function callGeminiTTS(promptText) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICE } } },
      },
    });
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${TTS_MODEL}:generateContent`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message || 'Error Gemini TTS'));
          const part = json.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          if (!part?.data) return reject(new Error('Respuesta TTS sin audio'));
          resolve(Buffer.from(part.data, 'base64'));
        } catch (err) { reject(err); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function generarNarracion(textoBase, outputPath, opciones = {}) {
  if (!GEMINI_API_KEY) {
    console.warn('   ⚠️ GEMINI_API_KEY no definido — narración omitida.');
    return { audioPath: null, duracionSeg: null };
  }
  const estilo = opciones.estilo || 'Voz de noticiero deportivo chileno: enérgica, natural, clara, pausas breves, sin gritar, sin inventar datos ni opiniones presentadas como hechos.';
  try {
    const pcm = await callGeminiTTS(`${estilo}\n\n${textoBase}`);
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

function construirGuion(item, modo = 'completo') {
  if (item.narracion) return item.narracion;
  const partes = [item.subtitulo, item.descripcion];
  if (Array.isArray(item.puntos) && item.puntos.length) {
    partes.push(...(modo === 'breve' ? item.puntos.slice(0, 1) : item.puntos));
  }
  return partes.filter(Boolean).join('. ');
}

module.exports = { generarNarracion, construirGuion, pcmToWav };

if (require.main === module) {
  const texto = process.argv[2] || 'Prueba de narración de fútbol chileno.';
  const out = process.argv[3] || 'out/test-narracion.wav';
  generarNarracion(texto, out).then(r => console.log(r));
}
