const https = require('https');

const required = ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN'];
const missing = required.filter((key) => !process.env[key]);

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
}, (res) => {
  let raw = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => { raw += chunk; });
  res.on('end', () => {
    let data = {};
    try { data = JSON.parse(raw); } catch {}

    if (res.statusCode !== 200 || !data.access_token) {
      console.error(`❌ YouTube OAuth rechazado (${res.statusCode}).`);
      if (data.error === 'invalid_grant') {
        console.error('Causa probable: el refresh token fue revocado, expiró o no corresponde al CLIENT_ID/CLIENT_SECRET actuales.');
      } else if (data.error) {
        console.error(`OAuth error: ${data.error}`);
      }
      process.exit(1);
    }

    console.log('✅ YouTube OAuth válido. El refresh token puede obtener un access token.');
  });
});

req.on('error', (err) => {
  console.error(`❌ No fue posible validar YouTube OAuth: ${err.message}`);
  process.exit(1);
});

req.write(body);
req.end();
