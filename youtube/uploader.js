/** youtube/uploader.js — Sube el MP4 + miniatura a YouTube (Data API v3). Lee YT_* (o YOUTUBE_*) del entorno. */
const fs = require('fs');
const { google } = require('googleapis');
const { markProcessed } = require('../scraper/news_scraper');
const log = (...a) => console.log('[youtube]', ...a);
const env = (k) => process.env[`YT_${k}`] || process.env[`YOUTUBE_${k}`];

function buildMetadata(st) {
  const title = `🇨🇱 NOTICIAS FÚTBOL CHILE | ${st.date} | ${st.headline}`.slice(0, 100);
  const resumen = st.noticias.map((n, i) => `${i + 1}. ${n.title} (${n.fuente_original || n.feed})`).join('\n');
  const description = `Resumen de noticias del fútbol chileno (masculino y femenino) e internacional — ${st.date}.\n\n${resumen}\n\nSuscríbete para recibir las noticias cada mañana y cada noche.\n\n#FutbolChileno #ANFP #LaRoja #LaRojaFemenina #FutbolFemenino #Chile`;
  const tags = ['fútbol chileno', 'ANFP', 'selección chilena', 'La Roja', 'La Roja Femenina', 'fútbol femenino Chile', 'Primera División Chile', 'Copa Chile', 'noticias fútbol', 'Colo-Colo', 'Universidad de Chile'];
  return { title, description, tags };
}

async function main() {
  const st = JSON.parse(fs.readFileSync('pipeline_state.json', 'utf8'));
  if (!st.hay_contenido) return log('Sin contenido; nada que subir.');
  const meta = buildMetadata(st);
  fs.writeFileSync(`videos/output/${st.date}.metadata.json`, JSON.stringify(meta, null, 2));
  if (process.env.UPLOAD_TO_YOUTUBE !== 'true') return log('UPLOAD_TO_YOUTUBE≠true: solo se generó metadata (modo revisión).');
  if (!env('CLIENT_ID') || !env('CLIENT_SECRET') || !env('REFRESH_TOKEN')) throw new Error('Faltan YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN');
  const auth = new google.auth.OAuth2(env('CLIENT_ID'), env('CLIENT_SECRET'));
  auth.setCredentials({ refresh_token: env('REFRESH_TOKEN') });
  const yt = google.youtube({ version: 'v3', auth });
  const res = await yt.videos.insert({
    part: ['snippet', 'status'],
    requestBody: { snippet: { ...meta, categoryId: '17', defaultLanguage: 'es', defaultAudioLanguage: 'es' }, status: { privacyStatus: process.env.YT_PRIVACY || 'private', selfDeclaredMadeForKids: false } },
    media: { body: fs.createReadStream(`videos/output/${st.date}.mp4`) },
  });
  log('Subido:', `https://youtu.be/${res.data.id}`);
  try { await yt.thumbnails.set({ videoId: res.data.id, media: { body: fs.createReadStream(`thumbnails/output/${st.date}.png`) } }); }
  catch (e) { log('WARN miniatura (requiere canal verificado):', e.message); }
  markProcessed(st.noticias);
}
if (require.main === module) main().catch(e => { console.error('[youtube] ERROR', e.message); process.exit(1); });
module.exports = { buildMetadata };
