/**
 * render-and-upload.js
 * Lee daily-content.json, renderiza cada video con Remotion y sube a YouTube
 */

const { execSync } = require('child_process');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// ─── Config YouTube OAuth ─────────────────────────────────────────────────────

function getYouTubeClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
  });
  return google.youtube({ version: 'v3', auth: oauth2Client });
}

// ─── Render con Remotion ──────────────────────────────────────────────────────

function renderVideo(data, outputPath) {
  const props = JSON.stringify({
    gancho:       data.gancho,
    subtitulo:    data.subtitulo,
    descripcion:  data.descripcion,
    equipo1:      data.equipo1,
    equipo2:      data.equipo2 || undefined,
    probabilidad: data.probabilidad,
    puntos:       data.puntos,
    emoji:        data.emoji,
    tipo:         data.tipo,
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

// ─── Upload a YouTube ─────────────────────────────────────────────────────────

async function uploadToYouTube(youtube, filePath, data) {
  const fileSize = fs.statSync(filePath).size;
  const tags = [
    ...(data.tags || []),
    'Mundial2026', 'Futbol', 'Shorts', 'FIFA', 'WorldCup2026',
    'IA', 'Prediccion', 'Mundial', 'Futbol2026',
  ];

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title:       data.titulo_youtube,
        description: data.descripcion_youtube,
        tags:        [...new Set(tags)].slice(0, 15),
        categoryId:  '17', // Sports
        defaultLanguage: 'es',
      },
      status: {
        privacyStatus:           'public',
        selfDeclaredMadeForKids: false,
        madeForKids:             false,
      },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  }, {
    onUploadProgress: (evt) => {
      const progress = Math.round((evt.bytesRead / fileSize) * 100);
      process.stdout.write(`\r   📤 Subiendo: ${progress}%`);
    },
  });

  console.log(`\n   ✅ Publicado: https://youtu.be/${response.data.id}`);
  return response.data.id;
}

// ─── Pipeline principal ───────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync('daily-content.json')) {
    console.error('❌ No se encontró daily-content.json — ejecutar generate-daily-content.js primero');
    process.exit(1);
  }

  const { contenido, fecha } = JSON.parse(fs.readFileSync('daily-content.json', 'utf8'));
  console.log(`\n🚀 Procesando ${contenido.length} videos para el ${fecha}\n`);

  const youtube = getYouTubeClient();
  const outDir = `out/${fecha}`;
  fs.mkdirSync(outDir, { recursive: true });

  const resultados = [];

  for (const item of contenido) {
    console.log(`\n──────────────────────────────`);
    console.log(`📌 ${item._orden}/${contenido.length}: ${item.gancho}`);
    console.log(`   Tipo: ${item._tipo_contenido}`);

    const videoFile = path.join(outDir, `video_${item._orden}_${item._tipo_contenido}.mp4`);

    try {
      // 1. Render
      renderVideo(item, videoFile);

      // 2. Delay entre videos (evitar rate limits)
      await new Promise(r => setTimeout(r, 3000));

      // 3. Upload
      const videoId = await uploadToYouTube(youtube, videoFile, item);

      resultados.push({
        orden:        item._orden,
        tipo:         item._tipo_contenido,
        gancho:       item.gancho,
        youtube_id:   videoId,
        youtube_url:  `https://youtu.be/${videoId}`,
        archivo:      videoFile,
        estado:       'OK',
      });

      // 4. Delay entre subidas
      await new Promise(r => setTimeout(r, 5000));

    } catch (err) {
      console.error(`\n   ❌ Error: ${err.message}`);
      resultados.push({
        orden:  item._orden,
        tipo:   item._tipo_contenido,
        gancho: item.gancho,
        estado: 'ERROR',
        error:  err.message,
      });
    }
  }

  // ─── Resumen final ──────────────────────────────────────────────────────────
  const reporte = {
    fecha,
    ejecutado_en: new Date().toISOString(),
    total:        contenido.length,
    exitosos:     resultados.filter(r => r.estado === 'OK').length,
    errores:      resultados.filter(r => r.estado === 'ERROR').length,
    videos:       resultados,
  };

  fs.writeFileSync(`out/reporte-${fecha}.json`, JSON.stringify(reporte, null, 2));

  console.log('\n\n══════════════════════════════════════');
  console.log('📊 RESUMEN DEL DÍA');
  console.log('══════════════════════════════════════');
  console.log(`✅ Exitosos: ${reporte.exitosos}/${reporte.total}`);
  if (reporte.errores > 0) console.log(`❌ Errores:  ${reporte.errores}`);
  console.log('\n📺 Videos publicados:');
  resultados
    .filter(r => r.estado === 'OK')
    .forEach(r => console.log(`   ${r.orden}. ${r.gancho} → ${r.youtube_url}`));
  console.log('\n💾 Reporte: out/reporte-' + fecha + '.json');
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});
