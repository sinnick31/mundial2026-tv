#!/usr/bin/env node
/**
 * Fail-closed validation for third-party media.
 * Original graphics and narration do not require a media licence manifest.
 * Any third-party media explicitly attached to an editorial item must carry
 * a documented YouTube + monetization permission before rendering.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_FILE = path.join(ROOT, 'daily-content.json');
const RIGHTS_FILE = path.join(ROOT, 'public', 'broll', 'rights-manifest.json');

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}
function isCurrent(date) {
  if (date === null || date === undefined || date === '') return true;
  const ms = Date.parse(date);
  return Number.isFinite(ms) && ms >= Date.now();
}
function isApproved(asset) {
  return Boolean(
    asset &&
    asset.rights_status === 'authorized' &&
    asset.youtube_allowed === true &&
    asset.monetization_allowed === true &&
    typeof asset.evidence_reference === 'string' &&
    asset.evidence_reference.trim() &&
    isCurrent(asset.valid_until)
  );
}

const content = readJson(CONTENT_FILE, null);
if (!content || !Array.isArray(content.contenido)) {
  console.error('❌ RIGHTS_CHECK: daily-content.json falta o tiene formato inválido.');
  process.exit(1);
}

const manifest = readJson(RIGHTS_FILE, { assets: [] });
const approved = new Set(
  (Array.isArray(manifest.assets) ? manifest.assets : [])
    .filter(isApproved)
    .map(asset => String(asset.file || ''))
);
let externalMediaCount = 0;

for (const [index, item] of content.contenido.entries()) {
  const declared = [];
  if (Array.isArray(item.media_assets)) declared.push(...item.media_assets);
  for (const key of ['media_url', 'video_url', 'clip_url', 'asset_url']) {
    if (item[key]) declared.push({ url: item[key], ...item.media_rights });
  }
  for (const asset of declared) {
    externalMediaCount += 1;
    if (!isApproved(asset)) {
      console.error('❌ RIGHTS_CHECK: pieza ' + (index + 1) + ' incluye material sin permiso documentado.');
      process.exit(1);
    }
  }
}

const brollDir = path.join(ROOT, 'public', 'broll');
const authorizedBroll = [...approved].filter(file => {
  const full = path.resolve(brollDir, file);
  const lower = full.toLowerCase();
  return full.startsWith(brollDir + path.sep) &&
    fs.existsSync(full) &&
    ['.mp4', '.mov', '.webm'].some(ext => lower.endsWith(ext));
});
console.log('🛡️ RIGHTS_CHECK OK: ' + externalMediaCount + ' recursos externos declarados autorizados.');
console.log('🎞️ B-roll con permiso documentado disponible: ' + authorizedBroll.length + '.');
if (!authorizedBroll.length) console.log('ℹ️ Se renderizará sin B-roll de terceros; se mantienen narración y gráficos originales.');
