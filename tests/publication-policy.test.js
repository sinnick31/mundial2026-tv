'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getPublicationPrivacy } = require('../scripts/publication-policy');

test('defaults to public when no visibility is configured', () => {
  assert.equal(
    getPublicationPrivacy({ requested: undefined, eventName: 'schedule' }),
    'public',
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

test('blocks scheduled public uploads if explicitly disabled', () => {
  assert.throws(
    () => getPublicationPrivacy({
      requested: 'public',
      eventName: 'schedule',
      allowScheduledPublic: 'false',
    }),
    /Scheduled public upload blocked/,
  );
});

test('allows scheduled public uploads by default', () => {
  assert.equal(
    getPublicationPrivacy({ requested: 'public', eventName: 'schedule' }),
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
