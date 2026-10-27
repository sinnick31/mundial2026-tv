'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePackage, validateSourceUrl } = require('../scripts/editorial-gate');

function validPackage() {
  const source = 'https://example.com/noticia-futbol';
  return {
    fecha: '2026-10-20',
    total: 1,
    contenido: [{
      _fuente_url: source,
      _fuente: 'Club o medio identificable',
      _noticia_original: 'Noticia deportiva verificada',
      titulo_youtube: 'FÚTBOL CHILENO: noticia y contexto',
      narracion: 'Esta narración explica un hecho publicado, identifica su fuente y aporta contexto original. '.repeat(3),
      descripcion_youtube: `Hecho y contexto. Fuente original: ${source}`,
      _categoria_editorial: 'chile',
      _orden: 1,
    }],
  };
}

test('acepta un paquete completo y con fuente verificable', () => {
  assert.deepEqual(validatePackage(validPackage()), { ok: true, total: 1 });
});

test('rechaza fuentes sin URL válida', () => {
  const pkg = validPackage();
  pkg.contenido[0]._fuente_url = 'javascript:alert(1)';
  assert.throws(() => validatePackage(pkg), /URL de fuente ausente o inválida/);
});

test('rechaza fuente genérica', () => {
  const pkg = validPackage();
  pkg.contenido[0]._fuente = 'Fuente deportiva';
  assert.throws(() => validatePackage(pkg), /nombre de fuente ausente o genérico/);
});

test('rechaza narración corta', () => {
  const pkg = validPackage();
  pkg.contenido[0].narracion = 'Titular y poco más.';
  assert.throws(() => validatePackage(pkg), /narración insuficiente/);
});

test('rechaza descripción sin URL de fuente', () => {
  const pkg = validPackage();
  pkg.contenido[0].descripcion_youtube = 'Sin referencia original';
  assert.throws(() => validatePackage(pkg), /descripción sin URL de fuente/);
});

test('acepta la categoría editorial de fútbol femenino', () => {
  const pkg = validPackage();
  pkg.contenido[0]._categoria_editorial = 'futbol_femenino';
  assert.deepEqual(validatePackage(pkg), { ok: true, total: 1 });
});

test('rechaza categorías desconocidas', () => {
  const pkg = validPackage();
  pkg.contenido[0]._categoria_editorial = 'rumor';
  assert.throws(() => validatePackage(pkg), /categoría editorial ausente/);
});

test('rechaza total incoherente o más de dos piezas', () => {
  const pkg = validPackage();
  pkg.total = 2;
  assert.throws(() => validatePackage(pkg), /total no coincide/);
  const tooMany = validPackage();
  tooMany.total = 3;
  tooMany.contenido = [tooMany.contenido[0], {...tooMany.contenido[0], _orden: 2}, {...tooMany.contenido[0], _orden: 3}];
  assert.throws(() => validatePackage(tooMany), /entre 1 y 2 piezas/);
});

test('rechaza URL con credenciales incrustadas', () => {
  assert.equal(validateSourceUrl('https://user:pass@example.com/story'), false);
});

test('rechaza entidades HTML en la narración antes del render', () => {
  const pkg = validPackage();
  pkg.contenido[0].narracion = 'La narración contiene &nbsp; sin decodificar. '.repeat(6);
  assert.throws(() => validatePackage(pkg), /entidad HTML sin decodificar en narracion/);
});

test('rechaza etiquetas HTML en títulos', () => {
  const pkg = validPackage();
  pkg.contenido[0].titulo_youtube = '<b>FÚTBOL CHILENO</b>: noticia y contexto';
  assert.throws(() => validatePackage(pkg), /etiquetas HTML sin limpiar en titulo_youtube/);
});
