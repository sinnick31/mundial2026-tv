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

function sanitizeErrorDescription(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\\r\\n\\t]+/g, ' ')
    .replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, '')
    .trim()
    .slice(0, 240);
}

function classifyTokenFailure(statusCode, data = {}) {
  if (statusCode === 200 && data.access_token) return null;

  const description = sanitizeErrorDescription(data.error_description);
  const detail = description ? ` Detalle de Google: ${description}` : '';

  switch (data.error) {
    case 'invalid_client':
      return {
        code: 'INVALID_CLIENT',
        message: `Google rechazó el cliente OAuth. CLIENT_ID y CLIENT_SECRET no corresponden al mismo cliente OAuth activo.${detail}`,
      };
    case 'invalid_grant':
      return {
        code: 'INVALID_REFRESH_TOKEN',
        message: `Google devolvió invalid_grant. La respuesta no identifica por sí sola la causa: el refresh token puede haber caducado o sido revocado, no corresponder al par CLIENT_ID/CLIENT_SECRET configurado, o estar afectado por el estado de consentimiento de la aplicación. Si la app es External/Testing y usa scopes de YouTube, comprueba también la caducidad de siete días. Revisa estos puntos antes de emitir otro token.${detail}`,
      };
    case 'unauthorized_client':
      return {
        code: 'UNAUTHORIZED_CLIENT',
        message: `El cliente OAuth no está autorizado para este flujo.${detail}`,
      };
    case 'deleted_client':
      return {
        code: 'DELETED_CLIENT',
        message: `El cliente OAuth fue eliminado o ya no está disponible.${detail}`,
      };
    default:
      return {
        code: 'TOKEN_EXCHANGE_FAILED',
        message: `Google OAuth respondió HTTP ${statusCode} con error ${data.error || 'desconocido'}.${detail}`,
      };
  }
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

  const tokenFailure = classifyTokenFailure(statusCode, data);
  if (tokenFailure) {
    fail(tokenFailure.code, tokenFailure.message);
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

if (require.main === module) {
  main().catch(error => {
    fail('UNEXPECTED', error.message);
  });
}

module.exports = {
  sanitizeErrorDescription,
  classifyTokenFailure,
};
