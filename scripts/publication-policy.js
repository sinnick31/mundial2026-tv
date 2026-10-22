'use strict';

const ALLOWED_VISIBILITIES = new Set(['private', 'unlisted', 'public']);

/**
 * Resolve YouTube upload visibility.
 * Scheduled uploads default to public unless explicitly overridden.
 */
function getPublicationPrivacy(options = {}) {
  const requested = String(
    options.requested ?? process.env.YOUTUBE_PRIVACY_STATUS ?? 'public',
  ).trim().toLowerCase();
  const eventName = String(
    options.eventName ?? process.env.GITHUB_EVENT_NAME ?? '',
  ).trim().toLowerCase();
  const allowScheduledPublic = String(
    options.allowScheduledPublic ?? process.env.ALLOW_SCHEDULED_PUBLIC ?? 'true',
  ).trim().toLowerCase() === 'true';

  if (!ALLOWED_VISIBILITIES.has(requested)) {
    throw new Error(
      `Invalid video visibility "${requested}". Allowed values: private, unlisted, public.`,
    );
  }

  if (eventName === 'schedule' && requested === 'public' && !allowScheduledPublic) {
    throw new Error(
      'Scheduled public upload blocked. Enable ALLOW_SCHEDULED_PUBLIC=true to allow automatic public publishing.',
    );
  }

  return requested;
}

module.exports = { getPublicationPrivacy };
