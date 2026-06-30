/**
 * render-and-upload.js (v2)
 * Lee daily-content.json (cantidad variable, puede ser 0 si no había nada nuevo)
 * Renderiza con Remotion y sube a YouTube. Si total=0, termina sin error.
 */

const { execSync } = require('child_process');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

function getYouTubeClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
  return google.youtube({ version: 'v3', auth: oauth2Client });
}

function renderVideo(data, outputPath) {
  const props = JSON.stringify({
    gancho: data.gancho,
    subtitulo: data.subtitulo,
    descripcion: data.descripcion,
    equipo1: data.equipo1,
    equipo2: data.equipo2 || undefined,
    probabilidad: data.probabilidad || 0,
    puntos: data.puntos,
    emoji: data.emoji,
    tipo: data.tipo,
  });

  const cmd = [
    'npx remotion render',
    'src/index.tsx',
    'PrediccionShorts',
    outputPath,
    `--props='${props.replace(/'/g, "'\\''")}'`,
    '--codec=h264',
    '--fps=30',
    '--width=1080',
    '--height=1920',
    '--concurrency=2',
  ].join(' ');

  console.log(`   🎬 Renderizando ${path.basename(outputPath)}...`);
  execSync(cmd, { stdio: 'inherit' });
  console.log(`   ✅ Video listo: ${outputPath}`);
}

async function uploadToYouTube(youtube, filePath, data) {
  const fileSize = fs.statSync(filePath).size;
  const tags = [...new Set([
    ...(data.tags || []),
    'Mundial2026', 'Futbol', 'Shorts', 'FIFA', 'WorldCup2026',
  ])].slice(0, 15);

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: data.titulo_youtube,
        description: data.descripcion_youtube,
        tags,
        categoryId: '17',
        defaultLanguage: 'es',
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
        madeForKids: false,
      },
    },
    media: { body: fs.createReadStream(filePath) },
  }, {
    onUploadProgress: (evt) => {
      const progress = Math.round((evt.bytesRead / fileSize) * 100);
      process.stdout.write(`\r   📤 Subiendo: ${progress}%`);
    },
  });

  console.log(`\n   ✅ Publicado: https://youtu.be/${response.data.id}`);
  return response.data.id;
}

async function main() {
  if (!fs.existsSync('daily-content.json')) {
    console.log('⚠️ No existe daily-content.json — nada que hacer.');
    return;
  }

  const { contenido, fecha, total } = JSON.parse(fs.readFileSync('daily-content.json', 'utf8'));

  if (!total || total === 0 || !contenido || contenido.length === 0) {
    console.log('ℹ️ No hay contenido nuevo único para publicar hoy. Pipeline termina sin generar videos.');
    return;
  }

  console.log(`\n🚀 Procesando ${contenido.length} video(s) único(s) para el ${fecha}\n`);

  const youtube = getYouTubeClient();
  const outDir = `out/${fecha}`;
  fs.mkdirSync(outDir, { recursive: true });

  const resultados = [];

  for (const item of contenido) {
    console.log(`\n──────────────────────────────`);
    console.log(`📌 ${item._orden}/${contenido.length}: ${item.gancho}  [${item._tipo_contenido}]`);

    const videoFile = path.join(outDir, `video_${item._orden}_${item._tipo_contenido}.mp4`);

    try {
      renderVideo(item, videoFile);
      await new Promise(r => setTimeout(r, 2000));
      const videoId = await uploadToYouTube(youtube, videoFile, item);

      resultados.push({
        orden: item._orden, tipo: item._tipo_contenido, gancho: item.gancho,
        youtube_id: videoId, youtube_url: `https://youtu.be/${videoId}`, estado: 'OK',
      });
      await new Promise(r => setTimeout(r, 4000));
    } catch (err) {
      console.error(`\n   ❌ Error: ${err.message}`);
      resultados.push({
        orden: item._orden, tipo: item._tipo_contenido, gancho: item.gancho,
        estado: 'ERROR', error: err.message,
      });
    }
  }

  const reporte = {
    fecha, ejecutado_en: new Date().toISOString(),
    total: contenido.length,
    exitosos: resultados.filter(r => r.estado === 'OK').length,
    errores: resultados.filter(r => r.estado === 'ERROR').length,
    videos: resultados,
  };
  fs.mkdirSync('out', { recursive: true });
  fs.writeFileSync(`out/reporte-${fecha}.json`, JSON.stringify(reporte, null, 2));

  console.log('\n\n══════════════════════════════════════');
  console.log('📊 RESUMEN DEL DÍA');
  console.log('══════════════════════════════════════');
  console.log(`✅ Exitosos: ${reporte.exitosos}/${reporte.total}`);
  if (reporte.errores > 0) console.log(`❌ Errores:  ${reporte.errores}`);
  resultados.filter(r => r.estado === 'OK').forEach(r =>
    console.log(`   ${r.orden}. [${r.tipo}] ${r.gancho} → ${r.youtube_url}`)
  );
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});
