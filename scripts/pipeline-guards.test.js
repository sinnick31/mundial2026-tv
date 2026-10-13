const test = require('node:test');
const assert = require('node:assert/strict');
const { hasSeenSource, registrar } = require('./content-history');

const now = new Date().toISOString();

test('deduplicates an identical source URL despite tracking parameters', () => {
  const history = { items: [{ fecha: now, source_url: 'https://example.com/story', titulo: 'Old title' }] };
  assert.equal(hasSeenSource(history, 'https://example.com/story?utm_source=feed', 'A changed title'), true);
});

test('deduplicates legacy history by substantially matching headline tokens', () => {
  const history = { items: [{
    fecha: now,
    titulo: 'FÚTBOL MUNDIAL: Corinthians vs. Colo Colo: Horario, posibles formaciones y dónde ver por TV y streaming',
  }] };
  assert.equal(hasSeenSource(history, 'https://example.com/new-url', 'Corinthians vs. Colo Colo: Horario, posibles formaciones y dónde ver por TV y streaming la Copa Libertadores Femenina'), true);
});

test('does not block a genuinely different story about the same club', () => {
  const history = { items: [{ fecha: now, titulo: 'Corinthians vs. Colo Colo: Horario y posibles formaciones' }] };
  assert.equal(hasSeenSource(history, 'https://example.com/transfer', 'Corinthians anuncia un nuevo fichaje para la próxima temporada'), false);
});

test('records normalized source URLs for future runs', () => {
  const history = { items: [] };
  registrar(history, {
    tipoContenido: 'noticia',
    hook: 'Gancho de prueba',
    titulo: 'Titular de prueba',
    sourceUrl: 'https://example.com/story?utm_campaign=test',
  });
  assert.equal(history.items[0].source_url, 'https://example.com/story');
});
