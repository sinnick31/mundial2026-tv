'use strict';

const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { esEtiquetaEditorialGenerica, esMismoEquipo, tieneAutorizacionVisual } = require('../scripts/render-and-upload');

test('reconoce etiquetas editoriales que no representan clubes', () => {
  for (const label of ['Fútbol chileno', 'Fútbol mundial', 'Chile', 'Noticias']) {
    assert.equal(esEtiquetaEditorialGenerica(label), true, label);
  }
});

test('no trata nombres concretos de clubes como etiquetas genéricas', () => {
  assert.equal(esEtiquetaEditorialGenerica('Colo-Colo'), false);
  assert.equal(esEtiquetaEditorialGenerica('Universidad de Chile'), false);
  assert.equal(esMismoEquipo('Colo-Colo', 'Colo Colo'), true);
});


test('bloquea imágenes y clips sin evidencia explícita de licencia o permiso para YouTube', () => {
  const incomplete = {
    rights: 'authorized',
    credit: 'Autor',
    sourceUrl: 'https://source.example/asset',
    permittedUse: ['youtube'],
  };
  assert.equal(tieneAutorizacionVisual(incomplete), false);
  assert.equal(tieneAutorizacionVisual({
    ...incomplete,
    authorizationReference: 'Permiso escrito 2026-11-04',
  }), true);
});

test('acepta una licencia verificable que autoriza expresamente uso en YouTube', () => {
  assert.equal(tieneAutorizacionVisual({
    rights: 'authorized',
    credit: 'Club / fotógrafo',
    sourceUrl: 'https://club.example/media/photo',
    licenseUrl: 'https://club.example/licencia/video',
    permittedUse: ['youtube_monetized'],
  }), true);
  assert.equal(tieneAutorizacionVisual({
    rights: 'authorized',
    credit: 'Autor',
    sourceUrl: 'http://source.example/asset',
    authorizationReference: 'permiso',
    permittedUse: ['youtube'],
  }), false);
});

test('no duplica la fecha de publicación cuando el crédito de fuente ya la incluye', () => {
  const component = fs.readFileSync(path.join(__dirname, '../src/PrediccionShorts.tsx'), 'utf8');
  assert.ok(component.includes('<CreditoFuente fuente={props.fuente || (props.fechaPublicacion ? `Fuente publicada: ${props.fechaPublicacion}` : undefined)} />'));
  assert.equal(component.includes("<CreditoFuente fuente={[props.fechaPublicacion ? `Fuente publicada: ${props.fechaPublicacion}` : '', props.fuente || ''].filter(Boolean).join(' · ')} />"), false);
});


test('usa gráficos de cancha originales como alternativa a fotos no autorizadas', () => {
  const component = fs.readFileSync(path.join(__dirname, '../src/PrediccionShorts.tsx'), 'utf8');
  assert.ok(component.includes('const PitchBackdrop: React.FC'));
  assert.ok(component.includes('<PitchBackdrop />'));
  assert.ok(component.includes('repeating-linear-gradient'));
});
