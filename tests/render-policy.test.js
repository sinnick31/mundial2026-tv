'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { esEtiquetaEditorialGenerica, esMismoEquipo } = require('../scripts/render-and-upload');

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
