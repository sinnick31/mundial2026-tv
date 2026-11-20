const http = require('node:http');
const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
const { readFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const { google } = require('googleapis');
const { verifyChannel } = require('./youtube-auth');

const repository = 'sinnick31/mundial2026-tv';
const expectedChannelId = 'UCQbAT9x3pVmV5oRAtwoKmKA';
const scopes = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
];

async function authorize(credentials) {
  const state = randomBytes(32).toString('base64url');
  const server = http.createServer();
  server.listen(0, '127.0.0.1');

  try {
    await once(server, 'listening');
    const redirect = `http://127.0.0.1:${server.address().port}/callback`;
    const client = new google.auth.OAuth2(credentials.client_id, credentials.client_secret, redirect);
    const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const code = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('La autorización tardó más de cinco minutos.')), 300_000);
      let received = false;

      server.on('request', (request, response) => {
        const url = new URL(request.url, redirect);
        if (request.method !== 'GET' || url.pathname !== '/callback') {
          response.writeHead(404).end();
          return;
        }
        if (received || url.searchParams.get('state') !== state) {
          response.writeHead(400).end('Respuesta OAuth inválida.');
          return;
        }

        received = true;
        clearTimeout(timeout);
        const code = url.searchParams.get('code');
        if (!code || url.searchParams.has('error')) {
          response.writeHead(400).end('Se canceló la autorización.');
          reject(new Error('Google no autorizó el canal. Revisa la cuenta y los permisos e inténtalo de nuevo.'));
          return;
        }
        response.writeHead(200).end('Respuesta recibida. Revisa la terminal para ver el resultado.');
        resolve(code);
      });

      console.log('Abre esta URL y selecciona el canal FÚTBOL CHILENSIS:');
      console.log(authUrl);
    });

    const { tokens } = await client.getToken({ code, codeVerifier });
    if (!tokens.refresh_token || !tokens.access_token) {
      throw new Error('Google no entregó los tokens de acceso sin conexión. Vuelve a autorizar con el consentimiento completo.');
    }

    const granted = tokens.scope?.split(/\s+/) || [];
    if (!scopes.every(scope => granted.includes(scope))) {
      throw new Error('Faltan permisos de lectura o subida. Autoriza ambos permisos.');
    }

    client.setCredentials({ refresh_token: tokens.refresh_token });
    const { token } = await client.getAccessToken();
    if (!token) throw new Error('Google no entregó un access token al probar el refresh token.');
    await verifyChannel(google.youtube({ version: 'v3', auth: client }), expectedChannelId);
    return tokens.refresh_token;
  } finally {
    server.close();
  }
}

async function main() {
  const [credentialsFile] = process.argv.slice(2);
  if (!credentialsFile || process.argv.length !== 3) {
    throw new Error('Uso: node scripts/renew-youtube-refresh-token.js RUTA_AL_JSON_DE_GOOGLE');
  }

  let credentials;
  try {
    credentials = JSON.parse(readFileSync(credentialsFile, 'utf8')).installed;
  } catch {
    throw new Error('No se pudo leer el JSON del cliente OAuth.');
  }
  if (!credentials?.client_id || !credentials?.client_secret) {
    throw new Error('Usa el JSON descargado de un cliente OAuth de escritorio.');
  }

  if (spawnSync('gh', ['auth', 'status', '--hostname', 'github.com'], { stdio: 'ignore' }).status !== 0) {
    throw new Error('Instala GitHub CLI e inicia sesión con gh auth login antes de continuar.');
  }

  const token = await authorize(credentials).catch(error => {
    if (!error.response) throw error;
    throw new Error('Google rechazó el canje o la consulta del canal. Revisa el cliente, los permisos y que YouTube Data API v3 esté habilitada.');
  });

  const result = spawnSync('gh', ['secret', 'set', 'YOUTUBE_REFRESH_TOKEN', '--repo', repository], {
    input: token,
    stdio: ['pipe', 'ignore', 'ignore'],
  });
  if (result.status !== 0) {
    throw new Error('GitHub no pudo guardar YOUTUBE_REFRESH_TOKEN. Verifica que tu usuario pueda administrar los secretos del repositorio.');
  }
  console.log('Canal verificado y YOUTUBE_REFRESH_TOKEN actualizado en GitHub.');
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
