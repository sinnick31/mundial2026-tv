'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildRetention, enrichPackage } = require('../scripts/retention-package');

function item() {
  return {
    _noticia_original: 'Colo-Colo confirma un nuevo refuerzo',
    _categoria_editorial: 'colo_colo',
    equipo1: 'Colo-Colo',
    subtitulo: 'Qué cambia para el equipo y qué dato seguir después.',
    descripcion: 'Análisis basado en la noticia publicada.',
    puntos: ['HECHO PUBLICADO: anuncio oficial', 'SIGUIENTE DATO: comprobar el próximo paso'],
    narracion: 'COLO-COLO. El club confirmó el anuncio. Según la fuente, el hecho fue publicado. Este contexto explica por qué importa.',
    titulo_youtube: 'COLO-COLO: refuerzo confirmado | Lo que se sabe',
  };
}

test('añade gancho inmediato, CTA, pregunta y miniatura estructurada', () => {
  const result = buildRetention(item());
  assert.match(result.gancho, /^¿Qué cambia de verdad/);
  assert.match(result.narracion, /^¿Qué cambia de verdad/);
  assert.match(result.narracion, /suscríbete a Chilensis Fútbol/);
  assert.match(result.narracion, /comentarios/);
  assert.ok(result.miniatura.prompt_generador_imagen.includes('16:9'));
  assert.ok(result.miniatura.texto_en_miniatura.split(/\s+/).length <= 3);
  assert.equal(result.estructura_retencion.cambios_de_ritmo[1].momento, 'cada 15s');
  assert.equal(result.estructura_retencion.cambios_de_ritmo[2].momento, '70-80%');
});

test('enriquece el paquete sin alterar el total ni borrar la fuente', () => {
  const pkg = { fecha: '2026-10-26', total: 1, contenido: [item()] };
  const result = enrichPackage(pkg);
  assert.equal(result.total, 1);
  assert.equal(result.contenido[0]._noticia_original, 'Colo-Colo confirma un nuevo refuerzo');
  assert.ok(result.contenido[0].cta_suscripcion);
});
