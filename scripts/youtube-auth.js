const https = require('https');
const { google } = require('googleapis');

const REQUIRED = [
  'YOUTUBE_CLIENT_ID',
  'YOUTUBE_CLIENT_SECRET',
  'YOUTUBE_REFRESH_TOKEN',
];

function validateEnvironment() {
  const missing = REQUIRED.filter(key => !process.env[key] || !process.env[key].trim());
  if (missing.length) {
    const error = new Error(`Faltan secretos de YouTube: ${missing.join(', ')}`);
    error.code = 'MISSING_SECRET';
    throw error;
  }
}

function createOAuthClient() {
  validateEnvironment();

  return new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET
  );
}

async function getAuthenticatedYouTube() {
  const oauth2Client = createOAuthClient();

  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  });

  const { token } = await oauth2Client.getAccessToken();
  if (!token) {
    const error = new Error('Google no entregó un access token.');
    error.code = 'TOKEN_EXCHANGE_FAILED';
    throw error;
  }

  return {
    oauth2Client,
    youtube: google.youtube({ version: 'v3', auth: oauth2Client }),
    accessToken: token,
  };
}

function getExpectedChannelId() {
  return process.env.YOUTUBE_CHANNEL_ID || 'UCQbAT9x3pVmV5oRAtwoKmKA';
}

async function verifyChannel(youtube) {
  const response = await youtube.channels.list({
    part: ['id', 'snippet'],
    mine: true,
  });

  const channel = response.data.items?.[0];
  if (!channel?.id) {
    const error = new Error('La autorización no expone ningún canal de YouTube.');
    error.code = 'NO_CHANNEL';
    throw error;
  }

  const expected = getExpectedChannelId();
  if (expected && channel.id !== expected) {
    const error = new Error(
      `La autorización pertenece al canal ${channel.id}, no al canal esperado ${expected}.`
    );
    error.code = 'WRONG_CHANNEL';
    throw error;
  }

  return channel;
}

module.exports = {
  REQUIRED,
  validateEnvironment,
  createOAuthClient,
  getAuthenticatedYouTube,
  getExpectedChannelId,
  verifyChannel,
};
