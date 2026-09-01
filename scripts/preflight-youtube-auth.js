const https = require('https');

const required = ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN'];
const missing = required.filter(key => !process.env[key]);

if (missing.length) {
  console.error(`❌ Faltan secretos de YouTube: ${missing.join(', ')}`);
  process.exit(1);
}

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
    let data = {};
    try { data = JSON.parse(raw); } catch {}

    if (res.statusCode !== 200 || !data.access_token) {
      console.error(`❌ YouTube OAuth rechazado (${res.statusCode}).`);
      if (data.error === 'invalid_grant') {
        console.error('❌ El refresh token ya no es válido para este cliente OAuth.');
        console.error('   Causas habituales: token revocado, proyecto OAuth cambiado o aplicación en modo Testing.');
        console.error('   SOLUCIÓN: volver a autorizar el canal con el mismo CLIENT_ID/SECRET y guardar el nuevo refresh token en GitHub Secrets.');
        console.error('   No existe una forma segura de convertir automáticamente un invalid_grant en un token válido desde GitHub Actions.');
        console.error('   Para evitar expiraciones de 7 días, el proyecto OAuth debe estar publicado en producción.');
      } else if (data.error) {
        console.error(`OAuth error: ${data.error}`);
      }
      process.exit(1);
    }

    console.log('✅ YouTube OAuth válido: se obtuvo access token a partir del refresh token.');
  });
});

req.on('error', err => {
  console.error(`❌ No fue posible validar YouTube OAuth: ${err.message}`);
  process.exit(1);
});

req.write(body);
req.end();
