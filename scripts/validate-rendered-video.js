'use strict';

const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

function validateRenderedVideo(filePath) {
  if (!fs.existsSync(filePath)) throw new Error('VIDEO_GATE_BLOCKED: no existe el archivo renderizado');
  const stat = fs.statSync(filePath);
  if (stat.size < 150_000) throw new Error('VIDEO_GATE_BLOCKED: archivo demasiado pequeño; posible render vacío');

  let probe;
  try {
    probe = JSON.parse(execFileSync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height',
      '-of', 'json', filePath,
    ], { encoding: 'utf8' }));
  } catch (error) {
    throw new Error('VIDEO_GATE_BLOCKED: ffprobe no pudo leer el MP4: ' + error.message);
  }

  const video = (probe.streams || []).find((s) => s.codec_type === 'video');
  const duration = Number(probe.format?.duration || 0);
  if (!video) throw new Error('VIDEO_GATE_BLOCKED: el archivo no contiene pista de video');
  if (video.width !== 1080 || video.height !== 1920) {
    throw new Error('VIDEO_GATE_BLOCKED: resolución incorrecta; se requiere 1080x1920 y se obtuvo ' + video.width + 'x' + video.height);
  }
  if (!Number.isFinite(duration) || duration < 8) {
    throw new Error('VIDEO_GATE_BLOCKED: duración insuficiente (' + duration + 's)');
  }

  // Only blocks long intervals where virtually the entire frame is black.
  // Dark sports graphics remain valid because text, lines and other elements break the threshold.
  let diagnostics = '';
  try {
    diagnostics = execFileSync('ffmpeg', [
      '-hide_banner', '-i', filePath, '-vf', 'blackdetect=d=2.8:pix_th=0.10:pic_th=0.98',
      '-an', '-f', 'null', '-',
    ], { encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (error) {
    diagnostics = String(error.stderr || '');
    if (error.status !== 0) {
      throw new Error('VIDEO_GATE_BLOCKED: ffmpeg no pudo analizar los fotogramas: ' + diagnostics.slice(-500));
    }
  }
  const blackIntervals = diagnostics.match(/black_duration:([0-9.]+)/g) || [];
  const longBlack = blackIntervals.map((entry) => Number(entry.split(':')[1])).filter((seconds) => seconds >= 2.8);
  if (longBlack.length) {
    throw new Error('VIDEO_GATE_BLOCKED: se detectó un tramo completamente negro de ' + longBlack.join(', ') + ' segundos');
  }

  return { ok: true, bytes: stat.size, duration: Number(duration.toFixed(2)), width: video.width, height: video.height };
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) throw new Error('Uso: node scripts/validate-rendered-video.js <archivo.mp4>');
  const result = validateRenderedVideo(file);
  console.log('VIDEO QUALITY GATE OK: ' + JSON.stringify(result));
}

module.exports = { validateRenderedVideo };
