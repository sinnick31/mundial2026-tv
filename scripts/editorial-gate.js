'use strict';

const fs = require('node:fs');

const MAX_ITEMS = 2;
const ALLOWED_CATEGORIES = new Set([
  'colo_colo',
  'chile',
  'chilenos_exterior',
  'internacional',
]);

function fail(message) {
  throw new Error(`EDITORIAL_GATE_BLOCKED: ${message}`);
}

function validateSourceUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol)
      && Boolean(url.hostname)
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
}

function validatePackage(pkg) {
  if (!pkg || typeof pkg !== 'object' || Array.isArray(pkg)) {
    fail('el paquete debe ser un objeto JSON');
  }
  if (!Array.isArray(pkg.contenido)) fail('contenido debe ser un arreglo');
  if (!Number.isInteger(pkg.total) || pkg.total !== pkg.contenido.length) {
    fail('total no coincide con la cantidad de piezas');
  }
  if (pkg.total < 1 || pkg.total > MAX_ITEMS) {
    fail(`se esperaban entre 1 y ${MAX_ITEMS} piezas; recibido: ${pkg.total}`);
  }
  if (typeof pkg.fecha !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(pkg.fecha)
      || Number.isNaN(Date.parse(pkg.fecha))) {
    fail('fecha de generación ausente o inválida');
  }

  pkg.contenido.forEach((item, index) => {
    const n = index + 1;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      fail(`pieza ${n}: formato inválido`);
    }
    if (!validateSourceUrl(item._fuente_url)) {
      fail(`pieza ${n}: URL de fuente ausente o inválida`);
    }
    if (typeof item._fuente !== 'string' || !item._fuente.trim()
        || /^(fuente deportiva|fuente no especificada|desconocida)$/i.test(item._fuente.trim())) {
      fail(`pieza ${n}: nombre de fuente ausente o genérico`);
    }
    if (typeof item._noticia_original !== 'string' || item._noticia_original.trim().length < 8) {
      fail(`pieza ${n}: hecho/titular original ausente`);
    }
    if (typeof item.titulo_youtube !== 'string'
        || item.titulo_youtube.trim().length < 12
        || item.titulo_youtube.length > 100) {
      fail(`pieza ${n}: título de YouTube inválido (12–100 caracteres)`);
    }
    if (typeof item.narracion !== 'string' || item.narracion.trim().length < 180) {
      fail(`pieza ${n}: narración insuficiente; mínimo 180 caracteres`);
    }
    if (typeof item.descripcion_youtube !== 'string'
        || !item.descripcion_youtube.includes(item._fuente_url)) {
      fail(`pieza ${n}: descripción sin URL de fuente`);
    }
    if (!ALLOWED_CATEGORIES.has(item._categoria_editorial)) {
      fail(`pieza ${n}: categoría editorial ausente o no reconocida`);
    }
    if (!Number.isInteger(item._orden) || item._orden !== n) {
      fail(`pieza ${n}: orden editorial incoherente`);
    }
  });

  return { ok: true, total: pkg.total };
}

if (require.main === module) {
  const file = process.argv[2] || 'daily-content.json';
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`no se pudo leer JSON válido en ${file}: ${error.message}`);
  }
  const result = validatePackage(pkg);
  console.log(`SOURCE LOCK + ORIGINALIDAD + METADATOS OK: ${result.total} pieza(s)`);
}

module.exports = { validatePackage, validateSourceUrl };
