const https = require('https');

const REQUIRED = [
  'YOUTUBE_CLIENT_ID',
  'YOUTUBE_CLIENT_SECRET',
  'YOUTUBE_REFRESH_TOKEN',
];

const EXPECTED_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCQbAT9x3pVmV5oRAtwoKmKA';

function fail(code, message) {
  console.error(`❌ [${code}] ${message}`);
  process.exit(1);
}

function postToken() {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }).toString();

    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          return reject(new Error(`TOKEN_ENDPOINT_INVALID_RESPONSE_${res.statusCode}`));
        }
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getChannel(accessToken) {
  return new Promise((resolve, reject) => {
    const req = https.request('https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }, res => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          return reject(new Error(`YOUTUBE_API_INVALID_RESPONSE_${res.statusCode}`));
        }
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const missing = REQUIRED.filter(key => !process.env[key] || !process.env[key].trim());
  if (missing.length) {
    fail('MISSING_SECRET', `Faltan secretos: ${missing.join(', ')}`);
  }

  console.log('🔐 Validación OAuth v8 iniciada');
  console.log('1/3 Secretos presentes: OK');

  let tokenResult;
  try {
    tokenResult = await postToken();
  } catch (error) {
    fail('TOKEN_NETWORK', `No fue posible contactar Google OAuth: ${error.message}`);
  }

  const { statusCode, data } = tokenResult;

  if (statusCode !== 200 || !data.access_token) {
    switch (data.error) {
      case 'invalid_client':
        fail(
          'INVALID_CLIENT',
          'Google rechazó el cliente OAuth. CLIENT_ID y CLIENT_SECRET no corresponden al mismo cliente OAuth activo.'
        );
      case 'invalid_grant':
        fail(
          'INVALID_REFRESH_TOKEN',
          'Google rechazó el refresh token. Debe haberse generado con el mismo cliente OAuth usado en CLIENT_ID/CLIENT_SECRET.'
        );
      case 'unauthorized_client':
        fail('UNAUTHORIZED_CLIENT', 'El cliente OAuth no está autorizado para este flujo.');
      case 'deleted_client':
        fail('DELETED_CLIENT', 'El cliente OAuth fue eliminado o ya no está disponible.');
      default:
        fail(
          'TOKEN_EXCHANGE_FAILED',
          `Google OAuth respondió HTTP ${statusCode} con error ${data.error || 'desconocido'}.`
        );
    }
  }

  console.log('2/3 Refresh token aceptado y access token obtenido: OK');

  let channelResult;
  try {
    channelResult = await getChannel(data.access_token);
  } catch (error) {
    fail('YOUTUBE_NETWORK', `No fue posible consultar YouTube Data API: ${error.message}`);
  }

  if (channelResult.statusCode !== 200) {
    const apiError = channelResult.data?.error?.errors?.[0]?.reason || channelResult.data?.error?.status;
    fail(
      'YOUTUBE_API_ERROR',
      `YouTube Data API respondió HTTP ${channelResult.statusCode}${apiError ? ` (${apiError})` : ''}.`
    );
  }

  const channels = channelResult.data.items || [];
  if (channels.length === 0) {
    fail('NO_CHANNEL', 'La cuenta autorizada no tiene un canal de YouTube accesible mediante esta autorización.');
  }

  const channel = channels[0];
  const channelId = channel.id;
  const channelTitle = channel.snippet?.title || 'sin título';

  if (EXPECTED_CHANNEL_ID && channelId !== EXPECTED_CHANNEL_ID) {
    fail(
      'WRONG_CHANNEL',
      `La autorización pertenece a otro canal. Canal recibido: ${channelId}. Canal esperado: ${EXPECTED_CHANNEL_ID}.`
    );
  }

  console.log('3/3 Canal autorizado: OK');
  console.log(`   Canal: ${channelTitle}`);
  console.log(`   ID: ${channelId}`);
  console.log('✅ YouTube OAuth v8 válido. El pipeline puede continuar con render + publicación.');
}

main().catch(error => {
  fail('UNEXPECTED', error.message);
});
