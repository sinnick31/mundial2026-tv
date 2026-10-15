'use strict';

const ALLOWED_VISIBILITIES = new Set(['private', 'unlisted', 'public']);

/**
 * Resolve YouTube upload visibility.
 *
 * Defaults to unlisted so scheduled videos can be reviewed before becoming public.
 * Scheduled public uploads require an explicit repository variable switch.
 * A manual workflow_dispatch can explicitly select public.
 */
function getPublicationPrivacy(options = {}) {
  const requested = String(
    options.requested ?? process.env.YOUTUBE_PRIVACY_STATUS ?? 'unlisted',
  ).trim().toLowerCase();
  const eventName = String(
    options.eventName ?? process.env.GITHUB_EVENT_NAME ?? '',
  ).trim().toLowerCase();
  const allowScheduledPublic = String(
    options.allowScheduledPublic ?? process.env.ALLOW_SCHEDULED_PUBLIC ?? 'false',
  ).trim().toLowerCase() === 'true';

  if (!ALLOWED_VISIBILITIES.has(requested)) {
    throw new Error(
      `Invalid video visibility "${requested}". Allowed values: private, unlisted, public.`,
    );
  }

  if (eventName === 'schedule' && requested === 'public' && !allowScheduledPublic) {
    throw new Error(
      'Scheduled public upload blocked. Review the video first or explicitly enable ALLOW_SCHEDULED_PUBLIC=true.',
    );
  }

  return requested;
}

module.exports = { getPublicationPrivacy };
