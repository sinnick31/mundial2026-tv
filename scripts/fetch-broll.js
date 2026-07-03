/**
 * fetch-broll.js — Descarga clips REALES de fútbol (Pexels, licencia libre)
 * y los deja listos en public/broll/ como MP4 verticales 1080x1920 de 8s.
 *
 * Esto elimina el fondo negro de los Shorts: los templates (PrediccionShorts
 * y JugadaAnimada) ya soportan brollSrc — solo faltaban los clips.
 *
 * Modos:
 *  1. Con PEXELS_API_KEY (secret) → busca clips frescos vía API (variedad ∞).
 *  2. Sin API key → descarga directa de una lista curada de Pexels
 *     (el mismo endpoint del botón "Free Download", no requiere key).
 *
 * Nunca rompe el pipeline: si todo falla, sale con código 0 y el video
 * se renderiza con el fondo de estadio procedural (fallback existente).
 *
 * Requiere ffmpeg (preinstalado en ubuntu-latest de GitHub Actions).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BROLL_DIR = path.join(ROOT, 'public', 'broll');
const TMP_DIR = path.join(ROOT, 'tmp-broll');
const TARGET_CLIPS = 6;      // clips finales deseados
const CLIP_SECONDS = 8;      // duración de cada clip procesado
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

// Queries variadas → cada día el pipeline puede rotar fondos distintos
const QUERIES = [
  'soccer stadium crowd',
  'football stadium night lights',
  'soccer field aerial',
  'football fans celebrating',
  'soccer match',
  'stadium flags crowd',
];

// Fallback sin API key: IDs curados de Pexels (video real de fútbol, licencia Pexels)
const FALLBACK_IDS = [8938615, 6077718, 28870860, 3441747, 15448993, 2657257, 14507176];

function log(msg) { console.log(`[broll] ${msg}`); }

function clipsExistentes() {
  if (!fs.existsSync(BROLL_DIR)) return [];
  return fs.readdirSync(BROLL_DIR).filter((f) => f.endsWith('.mp4'));
}

async function descargar(url, destino, extraHeaders = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, ...extraHeaders },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100_000) throw new Error(`Archivo sospechosamente chico (${buf.length} bytes)`);
  fs.writeFileSync(destino, buf);
  return buf.length;
}

function procesarConFfmpeg(entrada, salida) {
  // Vertical 1080x1920, 8s, sin audio, H.264 liviano — listo para OffthreadVideo
  execFileSync('ffmpeg', [
    '-y', '-i', entrada,
    '-t', String(CLIP_SECONDS),
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30',
    '-an',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    salida,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const size = fs.statSync(salida).size;
  if (size < 200_000) throw new Error('Clip procesado inválido');
  return size;
}

async function viaApi(apiKey, cuantos) {
  const urls = [];
  // Mezcla queries para variedad; pide portrait primero, acepta landscape (se recorta)
  const queries = [...QUERIES].sort(() => Math.random() - 0.5);
  for (const q of queries) {
    if (urls.length >= cuantos) break;
    try {
      const res = await fetch(
        `https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=4&size=medium`,
        { headers: { Authorization: apiKey, 'User-Agent': UA } },
      );
      if (!res.ok) { log(`API ${res.status} para "${q}" — sigo`); continue; }
      const data = await res.json();
      for (const video of data.videos || []) {
        // Archivo HD más liviano disponible
        const file = (video.video_files || [])
          .filter((f) => f.file_type === 'video/mp4' && f.height >= 720)
          .sort((a, b) => (a.width * a.height) - (b.width * b.height))[0];
        if (file?.link) urls.push(file.link);
        if (urls.length >= cuantos) break;
      }
    } catch (e) {
      log(`Query "${q}" falló: ${e.message} — sigo`);
    }
  }
  return urls;
}

function urlsFallback(cuantos) {
  return [...FALLBACK_IDS]
    .sort(() => Math.random() - 0.5)
    .slice(0, cuantos)
    .map((id) => `https://www.pexels.com/download/video/${id}/`);
}

async function main() {
  const existentes = clipsExistentes();
  if (existentes.length >= 3) {
    log(`Ya hay ${existentes.length} clips en public/broll/ — no descargo nada.`);
    return;
  }

  fs.mkdirSync(BROLL_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const apiKey = process.env.PEXELS_API_KEY;
  let urls = [];
  if (apiKey) {
    log('Usando Pexels API (PEXELS_API_KEY detectada)...');
    urls = await viaApi(apiKey, TARGET_CLIPS);
  }
  if (urls.length === 0) {
    log(apiKey
      ? 'API sin resultados — uso lista curada de respaldo.'
      : 'Sin PEXELS_API_KEY — uso lista curada de Pexels (descarga directa).');
    urls = urlsFallback(TARGET_CLIPS);
  }

  let ok = 0;
  for (let i = 0; i < urls.length; i++) {
    const raw = path.join(TMP_DIR, `raw${i}.mp4`);
    const final = path.join(BROLL_DIR, `clip${existentes.length + ok + 1}.mp4`);
    try {
      log(`Descargando ${i + 1}/${urls.length}...`);
      const bytes = await descargar(urls[i], raw);
      log(`  ${(bytes / 1e6).toFixed(1)} MB — procesando a 1080x1920/${CLIP_SECONDS}s...`);
      const outBytes = procesarConFfmpeg(raw, final);
      log(`  ✅ ${path.basename(final)} (${(outBytes / 1e6).toFixed(1)} MB)`);
      ok++;
    } catch (e) {
      log(`  ⚠️ Falló: ${e.message} — sigo con el próximo`);
      if (fs.existsSync(final)) fs.unlinkSync(final);
    } finally {
      if (fs.existsSync(raw)) fs.unlinkSync(raw);
    }
  }

  fs.rmSync(TMP_DIR, { recursive: true, force: true });

  if (ok === 0) {
    log('⚠️ No se pudo descargar ningún clip. El render usará el fondo procedural (NO se cae el pipeline).');
  } else {
    log(`🎞️ Listo: ${ok} clips reales en public/broll/. Los videos ya no tendrán fondo negro.`);
  }
}

main().catch((e) => {
  log(`Error no fatal: ${e.message}`);
  process.exit(0); // jamás romper el pipeline por el b-roll
});
