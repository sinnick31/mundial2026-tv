/**
 * render-and-upload.js (v3 — con voz, broll real y jugada animada)
 *
 * Lee daily-content.json. Para cada item:
 *  1. Genera narración en voz a partir del guion basado en la noticia fuente.
 *  2. Calcula la duración real del video según el largo del audio.
 *  3. Elige plantilla según tipo de contenido.
 *  4. Elige un clip de apoyo desde public/broll/ (si existe).
 *  5. Renderiza con Remotion y sube a YouTube.
 *
 * Los hechos deben venir del paquete editorial source-locked.
 * Si falla la publicación, el job termina con error.
 */

const { execSync } = require('child_process');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { generarNarracion, construirGuion } = require('./generate-narration');
const { estiloEquipo } = require('./team-styles');
const { enhanceGeneratedDescription } = require('./metadata-generator');

const ROOT = path.join(__dirname, '..');
const BROLL_DIR = path.join(ROOT, 'public', 'broll');
const PUBLIC_TMP_DIR = path.join(ROOT, 'public', 'tmp');
const FPS = 30;

const DURACION_POR_TIPO = {
  narrativa:  { fallbackSeg: 45, guion: 'completo' },
  noticia:    { fallbackSeg: 22, guion: 'breve' },
  prediccion: { fallbackSeg: 35, guion: 'completo' },
  ranking:    { fallbackSeg: 50, guion: 'completo' },
};

function fuenteTexto(item) {
  const fecha = item._fecha || new Date().toISOString().split('T')[0];
  const fuente = item._fuente || 'Fuente no especificada';
  return `Fuente: ${fuente} — ${fecha}`;
}

function getYouTubeClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
  return google.youtube({ version: 'v3', auth: oauth2Client });
}

function elegirBroll() {
  try {
    const archivos = fs.readdirSync(BROLL_DIR).filter(f => /\.(mp4|mov|webm)$/i.test(f));
    if (archivos.length === 0) return undefined;
    const elegido = archivos[Math.floor(Math.random() * archivos.length)];
    return `broll/${elegido}`;
  } catch {
    return undefined;
  }
}

function renderVideo(compositionId, props, outputPath, durationInFrames) {
  const propsJson = JSON.stringify(props);
  const cmd = [
    'npx remotion render',
    'src/index.tsx',
    compositionId,
    outputPath,
    `--props='${propsJson.replace(/'/g, "'\\''")}'`,
    `--duration-in-frames=${durationInFrames}`,
    '--codec=h264',
    '--fps=30',
    '--width=1080',
    '--height=1920',
    '--concurrency=2',
  ].join(' ');

  console.log(`   🎬 Renderizando [${compositionId}] ${path.basename(outputPath)} (${(durationInFrames / FPS).toFixed(1)}s)...`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
  console.log(`   ✅ Video listo: ${outputPath}`);
}

async function prepararNarracion(item) {
  const config = DURACION_POR_TIPO[item._tipo_contenido] || DURACION_POR_TIPO.prediccion;
  const guion = construirGuion(item, config.guion);
  fs.mkdirSync(PUBLIC_TMP_DIR, { recursive: true });
  const wavPath = path.join(PUBLIC_TMP_DIR, `narracion_${item._orden}.wav`);

  const { audioPath, duracionSeg } = await generarNarracion(guion, wavPath);

  if (!audioPath) {
    const jitterSeg = (Math.random() * 6) - 3;
    return {
      audioSrc: undefined,
      durationInFrames: Math.round((config.fallbackSeg + jitterSeg) * FPS),
    };
  }

  const audioSrc = `tmp/${path.basename(audioPath)}`;
  const padding = 3.5 + Math.random() * 2;
  const durationInFrames = Math.max(
    Math.ceil((duracionSeg + padding) * FPS),
    Math.round(8 * FPS),
  );
  return { audioSrc, durationInFrames };
}

async function prepararRender(item) {
  const brollSrc = elegirBroll();
  const { audioSrc, durationInFrames } = await prepararNarracion(item);

  const esPartidoJugado = item._tipo_contenido === 'narrativa'
    && item._goles_local !== null && item._goles_local !== undefined
    && item._goles_visita !== null && item._goles_visita !== undefined;

  if (esPartidoJugado) {
    const home = estiloEquipo(item.equipo1);
    const away = estiloEquipo(item.equipo2);
    const gol = item._gol_info || {};

    const props = {
      homeTeam: item.equipo1,
      awayTeam: item.equipo2,
      homeFlag: home.flag,
      awayFlag: away.flag,
      homeColor: home.color,
      awayColor: away.color,
      golesLocal: item._goles_local,
      golesVisita: item._goles_visita,
      scorerTeam: gol.scorerTeam || (item._goles_local >= item._goles_visita ? 'home' : 'away'),
      scorerName: gol.scorerName || undefined,
      scorerMinute: gol.scorerMinute || undefined,
      gancho: item.gancho,
      matchStage: item._fase || '',
      venue: '',
      brollSrc,
      audioSrc,
      fuente: fuenteTexto(item),
    };
    return { compositionId: 'JugadaAnimada', props, durationInFrames };
  }

  const props = {
    gancho: item.gancho,
    subtitulo: item.subtitulo,
    descripcion: item.descripcion,
    equipo1: item.equipo1,
    equipo2: item.equipo2 || undefined,
    probabilidad: item.probabilidad || 0,
    puntos: item.puntos,
    emoji: item.emoji,
    tipo: item.tipo,
    brollSrc,
    audioSrc,
    fuente: fuenteTexto(item),
  };
  return { compositionId: 'PrediccionShorts', props, durationInFrames };
}

async function uploadToYouTube(youtube, filePath, data) {
  const fileSize = fs.statSync(filePath).size;
  const tags = [...new Set([
    ...(data.tags || []),
    'Futbol', 'Shorts', 'FutbolChileno', 'ColoColo', 'LaRoja',
  ])].slice(0, 15);

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: data.titulo_youtube,
        description: enhanceGeneratedDescription(data.descripcion_youtube),
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
  fs.mkdirSync(PUBLIC_TMP_DIR, { recursive: true });

  const resultados = [];

  for (const item of contenido) {
    console.log(`\n──────────────────────────────`);
    console.log(`📌 ${item._orden}/${contenido.length}: ${item.gancho}  [${item._tipo_contenido}]`);

    const videoFile = path.join(outDir, `video_${item._orden}_${item._tipo_contenido}.mp4`);

    try {
      const { compositionId, props, durationInFrames } = await prepararRender(item);
      renderVideo(compositionId, props, videoFile, durationInFrames);
      await new Promise(r => setTimeout(r, 2000));
      const videoId = await uploadToYouTube(youtube, videoFile, item);

      resultados.push({
        orden: item._orden,
        tipo: item._tipo_contenido,
        plantilla: compositionId,
        gancho: item.gancho,
        fuente: item._fuente,
        fuente_url: item._fuente_url,
        youtube_id: videoId,
        youtube_url: `https://youtu.be/${videoId}`,
        estado: 'OK',
      });
      await new Promise(r => setTimeout(r, 4000));
    } catch (err) {
      console.error(`\n   ❌ Error: ${err.message}`);
      resultados.push({
        orden: item._orden,
        tipo: item._tipo_contenido,
        gancho: item.gancho,
        fuente: item._fuente,
        fuente_url: item._fuente_url,
        estado: 'ERROR',
        error: err.message,
      });
    }
  }

  try { fs.rmSync(PUBLIC_TMP_DIR, { recursive: true, force: true }); } catch {}

  const reporte = {
    fecha,
    ejecutado_en: new Date().toISOString(),
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
    console.log(`   ${r.orden}. [${r.plantilla || r.tipo}] ${r.gancho} → ${r.youtube_url}`)
  );

  if (reporte.errores > 0 || reporte.exitosos !== reporte.total) {
    console.error(`\n❌ Publicación incompleta: ${reporte.exitosos}/${reporte.total} videos publicados.`);
    process.exitCode = 1;
    return;
  }
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});
