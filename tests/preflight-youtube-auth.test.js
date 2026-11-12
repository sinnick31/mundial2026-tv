const test = require('node:test');
const assert = require('node:assert/strict');
const {
  classifyTokenFailure,
  sanitizeErrorDescription,
} = require('../scripts/preflight-youtube-auth');

test('invalid_grant no atribuye la causa únicamente a un cliente distinto', () => {
  const failure = classifyTokenFailure(400, {
    error: 'invalid_grant',
    error_description: 'Token has been expired or revoked.',
  });

  assert.equal(failure.code, 'INVALID_REFRESH_TOKEN');
  assert.match(failure.message, /no identifica por sí sola la causa/);
  assert.match(failure.message, /caducado o sido revocado/);
  assert.ok(failure.message.includes('CLIENT_ID/CLIENT_SECRET'));
  assert.ok(failure.message.includes('External/Testing'));
  assert.match(failure.message, /siete días/);
  assert.match(failure.message, /Token has been expired or revoked/);
});

test('invalid_grant sin descripción conserva un diagnóstico útil', () => {
  const failure = classifyTokenFailure(400, { error: 'invalid_grant' });

  assert.equal(failure.code, 'INVALID_REFRESH_TOKEN');
  assert.match(failure.message, /estado de consentimiento/);
  assert.doesNotMatch(failure.message, /Detalle de Google/);
});

test('invalid_client permanece diferenciado de invalid_grant', () => {
  const failure = classifyTokenFailure(401, {
    error: 'invalid_client',
    error_description: 'Bad client\ncredentials',
  });

  assert.equal(failure.code, 'INVALID_CLIENT');
  assert.match(failure.message, /no corresponden al mismo cliente/);
  assert.match(failure.message, /Bad client credentials/);
});

test('una respuesta válida con access token no produce fallo', () => {
  assert.equal(
    classifyTokenFailure(200, { access_token: 'test-access-token' }),
    null,
  );
});

test('la descripción de Google se limpia y limita antes de registrarla', () => {
  assert.equal(
    sanitizeErrorDescription('  Token\nhas\tbeen revoked.  '),
    'Token has been revoked.',
  );
  assert.equal(sanitizeErrorDescription('x'.repeat(300)).length, 240);
  assert.equal(sanitizeErrorDescription(undefined), '');
});
