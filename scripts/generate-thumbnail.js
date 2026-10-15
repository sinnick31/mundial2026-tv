#!/usr/bin/env node
/**
 * Generates a branded 1280x720 PNG thumbnail from a content item.
 * Requires rsvg-convert (provided by librsvg2-bin in GitHub Actions).
 * No third-party photos are used by default.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BRAND_PATH = path.join(ROOT, 'config', 'visual-brand.json');

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  }[ch]));
}
function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function sectionFor(item) {
  const category = normalize(item._categoria_editorial || item.categoria || '');
  if (category.includes('colo')) return 'colo_colo';
  if (category.includes('internacional') || category.includes('mundial')) return 'internacional';
  if (category.includes('exterior')) return 'chilenos_exterior';
  if (category.includes('libertadores')) return 'libertadores';
  if (category.includes('viral')) return 'viral';
  return 'chile';
}
function splitHeadline(value, max = 23) {
  const words = String(value || 'NOTICIAS DEL FÚTBOL').trim().split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (next.length > max && line) { lines.push(line); line = word; }
    else line = next;
    if (lines.length === 1 && line.length > max) line = line.slice(0, max - 1) + '…';
  }
  if (line) lines.push(line);
  if (lines.length > 2) {
    lines.length = 2;
    lines[1] = lines[1].slice(0, max - 1).replace(/[.,:;!?\s]+$/, '') + '…';
  }
  return lines;
}
function makeSvg(item, brand) {
  const palette = brand.palette;
  const sectionKey = sectionFor(item);
  const section = brand.sections[sectionKey] || brand.sections.chile;
  const headline = splitHeadline(item.gancho || item.titulo_youtube || item.subtitulo, 23);
  const line1 = escapeXml(headline[0] || 'FÚTBOL CHILENO');
  const line2 = escapeXml(headline[1] || 'Y MUNDIAL');
  const title = escapeXml(item.titulo_youtube || item.gancho || 'Noticias de fútbol');
  const blue = palette.blue, red = palette.red, navy = palette.navy;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <title>${title}</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${navy}"/><stop offset=".62" stop-color="#06101F"/><stop offset="1" stop-color="#182A46"/></linearGradient>
    <linearGradient id="glow"><stop offset="0" stop-color="${blue}" stop-opacity=".9"/><stop offset="1" stop-color="${blue}" stop-opacity="0"/></linearGradient>
    <pattern id="lines" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><path d="M0 0V64" stroke="#FFFFFF" stroke-opacity=".05" stroke-width="14"/></pattern>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dy="5"/><feComponentTransfer><feFuncA type="linear" slope=".7"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect width="1280" height="720" fill="url(#lines)"/>
  <path d="M0 530 L480 120 L660 120 L180 720 L0 720Z" fill="${blue}" opacity=".10"/>
  <path d="M930 0 H1280 V720 H1160 L1010 330Z" fill="${red}" opacity=".18"/>
  <circle cx="1050" cy="210" r="270" fill="url(#glow)" opacity=".22"/>
  <path d="M0 0 H1280 V18 H0Z" fill="${blue}"/>
  <path d="M0 18 H380 L340 29 H0Z" fill="${red}"/>
  <rect x="64" y="54" width="460" height="54" rx="8" fill="${red}"/>
  <text x="88" y="90" font-family="Montserrat,Arial,sans-serif" font-size="27" font-weight="800" fill="#FFFFFF" letter-spacing="2">${escapeXml(section)}</text>
  <g transform="translate(1090 84)">
    <path d="M0 0 L28 0 L40 18 L28 36 L0 36 L-12 18Z" fill="${blue}"/>
    <text x="14" y="25" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" font-weight="900" fill="#FFFFFF">M</text>
  </g>
  <g filter="url(#shadow)">
    <text x="64" y="330" font-family="Impact,'Arial Narrow',Arial,sans-serif" font-size="88" font-weight="900" fill="#FFFFFF" stroke="#07111F" stroke-width="3" paint-order="stroke">${line1}</text>
    <text x="64" y="435" font-family="Impact,'Arial Narrow',Arial,sans-serif" font-size="88" font-weight="900" fill="#FFD400" stroke="#07111F" stroke-width="3" paint-order="stroke">${line2}</text>
  </g>
  <path d="M64 484 H780 L750 496 H64Z" fill="${blue}"/>
  <text x="64" y="550" font-family="Montserrat,Arial,sans-serif" font-size="25" font-weight="700" fill="#FFFFFF">NOTICIAS · ANÁLISIS · RESÚMENES</text>
  <text x="64" y="660" font-family="Montserrat,Arial,sans-serif" font-size="22" font-weight="800" fill="#FFFFFF" letter-spacing="2">MUNDIAL 2026</text>
  <text x="1216" y="660" text-anchor="end" font-family="Montserrat,Arial,sans-serif" font-size="18" fill="#C7D5E8">@MUNDIAL2026SHORTS</text>
  <path d="M0 700 H1280 V720 H0Z" fill="${red}"/>
</svg>`;
}
function main() {
  const itemPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!itemPath || !outputPath) {
    console.error('Uso: node scripts/generate-thumbnail.js <item.json> <salida.png>');
    process.exit(2);
  }
  const item = JSON.parse(fs.readFileSync(path.resolve(itemPath), 'utf8'));
  const brand = JSON.parse(fs.readFileSync(BRAND_PATH, 'utf8'));
  const svgPath = outputPath.replace(/\.png$/i, '.svg');
  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
  fs.writeFileSync(svgPath, makeSvg(item, brand), 'utf8');
  const result = spawnSync('rsvg-convert', ['-w', '1280', '-h', '720', '-o', path.resolve(outputPath), path.resolve(svgPath)], { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    console.error('No se pudo convertir la miniatura a PNG. Instala librsvg2-bin. ' + (result.stderr || result.error?.message || ''));
    process.exit(1);
  }
  console.log('Miniatura generada: ' + path.resolve(outputPath));
}
if (require.main === module) main();
