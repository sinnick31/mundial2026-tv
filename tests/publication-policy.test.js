'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getPublicationPrivacy } = require('../scripts/publication-policy');

test('defaults to unlisted when no visibility is configured', () => {
  assert.equal(
    getPublicationPrivacy({ requested: undefined, eventName: 'schedule' }),
    'unlisted',
  );
});

test('accepts each supported visibility', () => {
  for (const requested of ['private', 'unlisted', 'public']) {
    assert.equal(
      getPublicationPrivacy({ requested, eventName: 'workflow_dispatch' }),
      requested,
    );
  }
});

test('rejects unsupported visibility values', () => {
  assert.throws(
    () => getPublicationPrivacy({ requested: 'friends-only', eventName: 'workflow_dispatch' }),
    /Invalid video visibility/,
  );
});

test('blocks scheduled public uploads unless explicitly enabled', () => {
  assert.throws(
    () => getPublicationPrivacy({
      requested: 'public',
      eventName: 'schedule',
      allowScheduledPublic: 'false',
    }),
    /Scheduled public upload blocked/,
  );
});

test('allows scheduled public uploads only when explicitly enabled', () => {
  assert.equal(
    getPublicationPrivacy({
      requested: 'public',
      eventName: 'schedule',
      allowScheduledPublic: 'true',
    }),
    'public',
  );
});

test('does not block explicit manual public publishing', () => {
  assert.equal(
    getPublicationPrivacy({
      requested: 'public',
      eventName: 'workflow_dispatch',
      allowScheduledPublic: 'false',
    }),
    'public',
  );
});
