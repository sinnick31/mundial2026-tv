'use strict';

const fs = require('node:fs');
const { execFileSync, spawnSync } = require('node:child_process');

function validateRenderedVideo(filePath) {
  if (!fs.existsSync(filePath)) throw new Error('VIDEO_GATE_BLOCKED: no existe el archivo renderizado');
  const stat = fs.statSync(filePath);
  if (stat.size < 150_000) throw new Error('VIDEO_GATE_BLOCKED: archivo demasiado pequeño; posible render vacío');

  let probe;
  try {
    probe = JSON.parse(execFileSync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,duration',
      '-of', 'json', filePath,
    ], { encoding: 'utf8' }));
  } catch (error) {
    throw new Error('VIDEO_GATE_BLOCKED: ffprobe no pudo leer el MP4: ' + error.message);
  }

  const streams = probe.streams || [];
  const video = streams.find((s) => s.codec_type === 'video');
  const audio = streams.find((s) => s.codec_type === 'audio');
  const duration = Number(probe.format?.duration || 0);
  if (!video) throw new Error('VIDEO_GATE_BLOCKED: el archivo no contiene pista de video');
  if (!audio) throw new Error('AV_GATE_BLOCKED: el archivo renderizado no contiene pista de audio/narración.');
  const audioDuration = Number(audio.duration || 0);
  if (!Number.isFinite(audioDuration) || audioDuration <= 0) {
    throw new Error('AV_GATE_BLOCKED: no se pudo verificar la duración de la pista de audio.');
  }
  if (audioDuration > duration + 0.5) {
    throw new Error('AV_GATE_BLOCKED: la pista de audio excede la duración del video (' + audioDuration + 's > ' + duration + 's).');
  }
  if (video.width !== 1080 || video.height !== 1920) {
    throw new Error('VIDEO_GATE_BLOCKED: resolución incorrecta; se requiere 1080x1920 y se obtuvo ' + video.width + 'x' + video.height);
  }
  if (!Number.isFinite(duration) || duration < 8) {
    throw new Error('VIDEO_GATE_BLOCKED: duración insuficiente (' + duration + 's)');
  }

  // Detecta negro real, no fondos deportivos oscuros ni degradados de la plantilla.
  // pix_th=0.03 exige luminancia prácticamente nula; pic_th=0.995 exige que
  // al menos el 99.5% del fotograma sea negro durante 2.8s continuos.
  const analysis = spawnSync('ffmpeg', [
    '-hide_banner', '-i', filePath, '-vf', 'blackdetect=d=2.8:pix_th=0.03:pic_th=0.995',
    '-an', '-f', 'null', '-',
  ], { encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'] });
  const diagnostics = String(analysis.stderr || '');
  if (analysis.error || analysis.status !== 0) {
    throw new Error('VIDEO_GATE_BLOCKED: ffmpeg no pudo analizar los fotogramas: ' + String(analysis.error || diagnostics).slice(-500));
  }

  const intervals = [...diagnostics.matchAll(/black_start:([0-9.]+)\s+black_end:([0-9.]+)\s+black_duration:([0-9.]+)/g)]
    .map((match) => ({ start: Number(match[1]), end: Number(match[2]), duration: Number(match[3]) }))
    .filter((interval) => interval.duration >= 2.8);
  if (intervals.length) {
    const detail = intervals.map((interval) =>
      interval.start.toFixed(2) + '-' + interval.end.toFixed(2) + 's (' + interval.duration.toFixed(2) + 's)'
    ).join(', ');
    throw new Error('VIDEO_GATE_BLOCKED: se detectó un tramo completamente negro: ' + detail);
  }

  return { ok: true, bytes: stat.size, duration: Number(duration.toFixed(2)), audioDuration: Number(audioDuration.toFixed(2)), width: video.width, height: video.height };
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) throw new Error('Uso: node scripts/validate-rendered-video.js <archivo.mp4>');
  const result = validateRenderedVideo(file);
  console.log('VIDEO QUALITY GATE OK: ' + JSON.stringify(result));
}

module.exports = { validateRenderedVideo };
