'use strict';

function normalizeEvidence(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * An RSS/metadata excerpt must add information beyond the headline.
 * This prevents scorecard titles or page metadata from being relabelled
 * as an attributed excerpt and expanded into a synthetic narration.
 */
function hasIndependentEvidence(brief, title) {
  const text = String(brief || '').trim();
  if (text.length < 60) return false;

  const briefTokens = [...new Set(normalizeEvidence(text).split(' ').filter(token => token.length >= 3))];
  const titleTokens = new Set(normalizeEvidence(title).split(' ').filter(token => token.length >= 3));
  if (!briefTokens.length || !titleTokens.size) return false;

  const novelTokens = briefTokens.filter(token => !titleTokens.has(token));
  const overlap = (briefTokens.length - novelTokens.length) / briefTokens.length;
  const novelCharacters = novelTokens.reduce((total, token) => total + token.length, 0);

  return novelTokens.length >= 4 && novelCharacters >= 24 && overlap <= 0.82;
}

module.exports = { normalizeEvidence, hasIndependentEvidence };
