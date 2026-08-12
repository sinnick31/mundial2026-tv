/**
 * render-longform.js
 * Renderiza daily-longform.json en 16:9 y lo publica como video largo.
 */

const { execFileSync } = require('child_process');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { generarNarracion } = require('./generate-narration');

const ROOT = path.join(__dirname, '..');
const TMP = path.join(ROOT, 'public', 'tmp');
const FPS = 30;

function youtubeClient() {
  const oauth = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  oauth.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
  return google.youtube({ version: 'v3', auth: oauth });
}

function buildScript(data) {
  const parts = [data.intro];
  for (const s of data.sections || []) {
    parts.push(`Tema ${s.orden}. ${s.titulo}. ${s.cuerpo}. La fuente es ${s.fuente}.`);
  }
  return parts.join(' ');
}

async function main() {
  if (!fs.existsSync('daily-longform.json')) {
    console.log('ℹ️ No existe daily-longform.json.');
    return;
  }
  const data = JSON.parse(fs.readFileSync('daily-longform.json', 'utf8'));
  if (!data.total || !data.sections?.length) {
    console.log('ℹ️ No hay suficientes fuentes para resumen largo.');
    return;
  }

  fs.mkdirSync(TMP, { recursive: true });
  const wav = path.join(TMP, 'longform.wav');
  const { audioPath, duracionSeg } = await generarNarracion(buildScript(data), wav);
  const audioSrc = audioPath ? `tmp/${path.basename(audioPath)}` : undefined;
  const duration = Math.max(120, Math.min(900, Math.ceil((duracionSeg || 180) + 5)));
  const frames = duration * FPS;
  const outDir = path.join(ROOT, 'out', data.fecha || new Date().toISOString().slice(0,10));
  fs.mkdirSync(outDir, { recursive: true });
  const outfile = path.join(outDir, 'resumen_futbol_chileno.mp4');

  const props = JSON.stringify({ title: data.titulo, intro: data.intro, sections: data.sections, audioSrc, fuente: 'Fuentes originales enlazadas en la descripción' });
  execFileSync('npx', [
    'remotion', 'render', 'src/index.tsx', 'ChileLongform', outfile,
    '--props', props,
    `--duration-in-frames=${frames}`,
    '--codec=h264', '--fps=30', '--width=1920', '--height=1080', '--concurrency=2',
  ], { cwd: ROOT, stdio: 'inherit' });

  const description = [
    data.description,
    ...data.sections.map(s => `Fuente ${s.orden}: ${s.fuente} — ${s.url}`),
  ].join('\n\n');

  const youtube = youtubeClient();
  const response = await youtube.videos.insert({
    part: ['snippet','status'],
    requestBody: {
      snippet: {
        title: data.titulo,
        description,
        tags: ['FutbolChileno','ColoColo','Chile','LigaDePrimera','FutbolistasChilenos'],
        categoryId: '17',
        defaultLanguage: 'es',
      },
      status: { privacyStatus: 'public', madeForKids: false, selfDeclaredMadeForKids: false },
    },
    media: { body: fs.createReadStream(outfile) },
  });

  console.log(`✅ Resumen largo publicado: https://youtu.be/${response.data.id}`);
  fs.writeFileSync(path.join(outDir, 'resumen-largo-reporte.json'), JSON.stringify({ youtube_id: response.data.id, url: `https://youtu.be/${response.data.id}`, fecha: data.fecha }, null, 2));
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) {}
}

main().catch(err => {
  console.error(`❌ render-longform: ${err.message}`);
  process.exit(1);
});
