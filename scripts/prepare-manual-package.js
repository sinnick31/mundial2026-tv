'use strict';

const fs = require('node:fs');
const { validatePackage } = require('./editorial-gate');
const { validateItemForRender } = require('./content-quality-gate');
const { enrichPackage } = require('./retention-package');

const MAX_SOURCE_AGE_HOURS = 72;
const MAX_FUTURE_HOURS = 6;

function prepareManualPackage(template, now = new Date()) {
  if (!template || !Array.isArray(template.contenido) || template.contenido.length !== 1) {
    throw new Error('MANUAL_PACKAGE_BLOCKED: se esperaba exactamente una pieza editorial.');
  }
  const item = template.contenido[0];
  const publishedAt = Date.parse(item._fecha_publicacion_iso || '');
  if (!Number.isFinite(publishedAt)) {
    throw new Error('MANUAL_PACKAGE_BLOCKED: falta una fecha ISO verificable de publicación de la fuente.');
  }
  const ageHours = (now.getTime() - publishedAt) / 36e5;
  if (ageHours > MAX_SOURCE_AGE_HOURS || ageHours < -MAX_FUTURE_HOURS) {
    throw new Error('MANUAL_PACKAGE_STALE: la noticia está fuera de la ventana editorial de -6/+72 horas.');
  }
  let sourceHost;
  let corroborationHost;
  try {
    sourceHost = new URL(item._fuente_url).hostname;
    corroborationHost = new URL(item._fuente_secundaria_url).hostname;
  } catch {
    throw new Error('MANUAL_PACKAGE_BLOCKED: URL de fuente principal o corroboración inválida.');
  }
  if (sourceHost !== 'tntsports.cl' || corroborationHost !== 'www.udechile.cl') {
    throw new Error('MANUAL_PACKAGE_BLOCKED: las fuentes no coinciden con TNT Sports Chile y el sitio oficial del club.');
  }
  if (item._tipo_contenido !== 'noticia' || item._articulo_completo !== true
      || !Number.isInteger(item._articulo_caracteres) || item._articulo_caracteres < 300) {
    throw new Error('MANUAL_PACKAGE_BLOCKED: la pieza no acredita artículo completo.');
  }
  const pkg = {
    fecha: now.toISOString().slice(0, 10),
    total: 1,
    contenido: [structuredClone(item)],
  };
  enrichPackage(pkg);
  validatePackage(pkg);
  validateItemForRender(pkg.contenido[0], 1);
  return pkg;
}

if (require.main === module) {
  const input = process.argv[2];
  if (!input) throw new Error('Uso: node scripts/prepare-manual-package.js <archivo.json>');
  const template = JSON.parse(fs.readFileSync(input, 'utf8'));
  const pkg = prepareManualPackage(template);
  fs.writeFileSync('daily-content.json', JSON.stringify(pkg, null, 2) + '\n');
  console.log('Paquete manual verificado y listo: ' + pkg.total + ' pieza(s), fecha ' + pkg.fecha);
}

module.exports = { prepareManualPackage, MAX_SOURCE_AGE_HOURS, MAX_FUTURE_HOURS };
