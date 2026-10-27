'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getPublicationPrivacy } = require('../scripts/publication-policy');

test('defaults to private when no visibility is configured', () => {
  assert.equal(getPublicationPrivacy({ requested: undefined, eventName: 'schedule' }), 'private');
});

test('accepts supported visibility values for explicit manual runs', () => {
  for (const requested of ['private', 'unlisted', 'public']) {
    assert.equal(getPublicationPrivacy({ requested, eventName: 'workflow_dispatch' }), requested);
  }
});

test('rejects unsupported visibility values', () => {
  assert.throws(() => getPublicationPrivacy({ requested: 'friends-only', eventName: 'workflow_dispatch' }), /Invalid video visibility/);
});

test('blocks scheduled public uploads by default', () => {
  assert.throws(() => getPublicationPrivacy({ requested: 'public', eventName: 'schedule' }), /Scheduled public upload blocked/);
});

test('blocks scheduled public uploads when explicitly disabled', () => {
  assert.throws(() => getPublicationPrivacy({ requested: 'public', eventName: 'schedule', allowScheduledPublic: 'false' }), /Scheduled public upload blocked/);
});

test('does not block explicit manual public publishing', () => {
  assert.equal(getPublicationPrivacy({ requested: 'public', eventName: 'workflow_dispatch', allowScheduledPublic: 'false' }), 'public');
});
