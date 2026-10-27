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
const { getAuthenticatedYouTube } = require('./youtube-auth');
const { getPublicationPrivacy } = require('./publication-policy');
const fs = require('fs');
const path = require('path');
const { generarNarracion, construirGuion } = require('./generate-narration');
const { estiloEquipo } = require('./team-styles');
const { enhanceGeneratedDescription } = require('./metadata-generator');
const { validateItemForRender } = require('./content-quality-gate');
const { validateRenderedVideo } = require('./validate-rendered-video');
const { cleanVisibleText } = require('./text-sanitizer');

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
  const fecha = item._fecha_publicacion_fuente || item._fecha || 'fecha no verificada';
  const fuente = item._fuente || 'Fuente no especificada';
  return `Fuente: ${fuente} — ${fecha}`;
}

async function getYouTubeClient() {
  const { youtube } = await getAuthenticatedYouTube();
  return youtube;
}


function normalizarNombreEquipo(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function esMismoEquipo(a, b) {
  const alias = {
    colocolocolo: 'colocolo',
    colocolosadp: 'colocolo',
    catolica: 'universidadcatolica',
    uc: 'universidadcatolica',
    ucatolica: 'universidadcatolica',
    udec: 'universidaddeconcepcion',
    laudeconce: 'universidaddeconcepcion',
    laude: 'udechile',
    universidaddechile: 'udechile',
    uchile: 'udechile',
    unionespaniola: 'unionespanola',
  };
  const na = normalizarNombreEquipo(a);
  const nb = normalizarNombreEquipo(b);
  return na === nb || (alias[na] || na) === (alias[nb] || nb);
}

// Etiquetas editoriales, no nombres de clubes. No deben exigir una foto de un equipo real.
function esEtiquetaEditorialGenerica(nombreEquipo) {
  const normalizado = normalizarNombreEquipo(nombreEquipo);
  return new Set([
    'futbolchileno',
    'futbolmundial',
    'noticias',
    'chile',
    'equipolocal',
    'equipovisitante',
    'pordefinir',
  ]).has(normalizado);
}

function imagenAutorizadaParaEquipo(nombreEquipo) {
  // TEAM_IMAGES_JSON: {"Colo-Colo":{"url":"https://...","credit":"Club/autor","rights":"authorized","team":"Colo-Colo"}}
  // Una URL no basta: el catálogo debe identificar explícitamente el equipo y confirmar derechos.
  try {
    const catalogo = JSON.parse(process.env.TEAM_IMAGES_JSON || '{}');
    const key = Object.keys(catalogo).find(k => esMismoEquipo(k, nombreEquipo));
    const item = key ? catalogo[key] : null;
    if (!item || item.rights !== 'authorized' || !/^https:\/\//i.test(item.url || '')) return {};
    if (typeof item.team !== 'string' || !esMismoEquipo(item.team, nombreEquipo)) return {};
    return {
      imagenEquipoSrc: item.url,
      imagenEquipoCredito: item.credit || 'Crédito no indicado',
      imagenEquipoNombreVerificado: nombreEquipo,
    };
  } catch {
    return {};
  }
}

function elegirBroll(item) {
  // Nunca elegir clips al azar: el b-roll genérico puede mostrar un club equivocado.
  // TEAM_BROLL_MANIFEST: [{"file":"colo-colo-01.mp4","team":"Colo-Colo","rights":"authorized","sourceUrl":"https://...","credit":"Autor/club"}]
  try {
    const manifest = JSON.parse(process.env.TEAM_BROLL_MANIFEST || '[]');
    if (!Array.isArray(manifest)) return undefined;
    const equiposNoticia = [item?.equipo1, item?.equipo2].filter(Boolean);
    const candidatos = manifest.filter(entry => {
      if (!entry || entry.rights !== 'authorized' || typeof entry.file !== 'string' || typeof entry.team !== 'string') return false;
      if (typeof entry.credit !== 'string' || !entry.credit.trim()) return false;
      if (typeof entry.sourceUrl !== 'string' || !/^https:\/\//i.test(entry.sourceUrl)) return false;
      if (!equiposNoticia.some(equipo => esMismoEquipo(equipo, entry.team))) return false;
      if (path.basename(entry.file) !== entry.file || !/\.(mp4|mov|webm)$/i.test(entry.file)) return false;
      // Nunca permitir que clips genéricos descargados por fetch-broll.js se etiqueten como material de un club.
      if (/^clip\d+\.(mp4|mov|webm)$/i.test(entry.file)) return false;
      return fs.existsSync(path.join(BROLL_DIR, entry.file));
    });
    if (!candidatos.length) return undefined;
    const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];
    return `broll/${elegido.file}`;
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

  if (!audioPath || !Number.isFinite(duracionSeg) || duracionSeg <= 0 || !fs.existsSync(audioPath)) {
    throw new Error('AV_GATE_BLOCKED: no se generó una narración de audio válida; no se renderiza ni publica un video silencioso.');
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
  const brollSrc = elegirBroll(item);
  const esPartidoJugado = item._tipo_contenido === 'narrativa'
    && item._goles_local !== null && item._goles_local !== undefined
    && item._goles_visita !== null && item._goles_visita !== undefined;

  // Fail closed: una crónica de partido exige un clip autorizado asociado a uno de sus equipos.
  // No se acepta b-roll genérico como prueba visual de un partido concreto.
  if (esPartidoJugado && !brollSrc) {
    throw new Error('AV_GATE_BLOCKED: partido sin clip autorizado y verificado para equipo1/equipo2 en TEAM_BROLL_MANIFEST.');
  }

  const imagen = esEtiquetaEditorialGenerica(item.equipo1) ? {} : imagenAutorizadaParaEquipo(item.equipo1);
  const imagen2 = item.equipo2 && !esEtiquetaEditorialGenerica(item.equipo2)
    ? imagenAutorizadaParaEquipo(item.equipo2)
    : {};
  // Solo exigimos fotos de catálogo cuando el guion nombra un club/selección concreto.
  // Etiquetas de sección como "Fútbol chileno" usan el gráfico tipográfico de la plantilla,
  // sin inventar que una imagen corresponde a un club específico.
  if (!esPartidoJugado && item.equipo1 && !esEtiquetaEditorialGenerica(item.equipo1) && !imagen.imagenEquipoSrc) {
    throw new Error('AV_GATE_BLOCKED: falta imagen autorizada y asociada al equipo ' + item.equipo1 + ' en TEAM_IMAGES_JSON.');
  }
  if (!esPartidoJugado && item.equipo2 && !esEtiquetaEditorialGenerica(item.equipo2) && !imagen2.imagenEquipoSrc) {
    throw new Error('AV_GATE_BLOCKED: falta imagen autorizada y asociada al equipo ' + item.equipo2 + ' en TEAM_IMAGES_JSON.');
  }

  const { audioSrc, durationInFrames } = await prepararNarracion(item);

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
    ...imagen,
    imagenEquipo2Src: imagen2.imagenEquipoSrc,
    imagenEquipo2Credito: imagen2.imagenEquipoCredito,
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
    fechaPublicacion: item._fecha_publicacion_fuente || undefined,
    etiquetaCanal: '@CHILENSISFUTBOL',
    etiquetaSeccion: item._categoria_editorial === 'futbol_femenino' ? 'FÚTBOL FEMENINO' : item._categoria_editorial === 'internacional' ? 'FÚTBOL MUNDIAL' : item._categoria_editorial === 'chilenos_exterior' ? 'CHILENOS POR EL MUNDO' : item._categoria_editorial === 'colo_colo' ? 'COLO-COLO' : 'FÚTBOL CHILENO',
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
        privacyStatus: getPublicationPrivacy(),
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

function limpiarTextoVisible(valor) {
  return typeof valor === 'string' ? cleanVisibleText(valor) : valor;
}

function limpiarPiezaAntesDeValidar(item) {
  const campos = [
    'gancho', 'subtitulo', 'descripcion', 'narracion', 'titulo_youtube',
    'descripcion_youtube', '_noticia_original', '_fuente', 'equipo1', 'equipo2',
  ];
  let camposLimpiados = 0;
  for (const campo of campos) {
    if (typeof item[campo] === 'string') {
      const limpio = limpiarTextoVisible(item[campo]);
      if (limpio !== item[campo]) camposLimpiados++;
      item[campo] = limpio;
    }
  }
  if (Array.isArray(item.puntos)) {
    item.puntos = item.puntos.map((punto) => {
      if (typeof punto !== 'string') return punto;
      const limpio = limpiarTextoVisible(punto);
      if (limpio !== punto) camposLimpiados++;
      return limpio;
    });
  }
  if (camposLimpiados) {
    console.log('   🧹 Texto de fuente normalizado en ' + camposLimpiados + ' campo(s) antes de validar.');
  }
}

async function main() {
  const renderOnly = String(process.env.RENDER_ONLY || '').trim().toLowerCase() === 'true';
  if (renderOnly) console.log('🧪 MODO RENDER-ONLY: se renderiza y valida, sin OAuth ni subida a YouTube.');

  if (!fs.existsSync('daily-content.json')) {
    throw new Error('PACKAGE_GATE_BLOCKED: no existe daily-content.json en el directorio de trabajo. Comprueba la descarga del artefacto del job generate.');
  }

  const { contenido, fecha, total } = JSON.parse(fs.readFileSync('daily-content.json', 'utf8'));

  if (!Array.isArray(contenido) || !Number.isInteger(total) || total !== contenido.length || total === 0) {
    throw new Error('PACKAGE_GATE_BLOCKED: daily-content.json está vacío o tiene total/contenido incoherentes. No se genera una publicación ni se omite silenciosamente el reporte.');
  }

  console.log(`\n🚀 Procesando ${contenido.length} video(s) único(s) para el ${fecha}\n`);

  const youtube = renderOnly ? null : await getYouTubeClient();
  const outDir = `out/${fecha}`;
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(PUBLIC_TMP_DIR, { recursive: true });

  const resultados = [];

  for (const item of contenido) {
    console.log(`\n──────────────────────────────`);
    console.log(`📌 ${item._orden}/${contenido.length}: ${item.gancho}  [${item._tipo_contenido}]`);

    const videoFile = path.join(outDir, `video_${item._orden}_${item._tipo_contenido}.mp4`);

    try {
      limpiarPiezaAntesDeValidar(item);
      validateItemForRender(item, item._orden || resultados.length + 1);
      const { compositionId, props, durationInFrames } = await prepararRender(item);
      renderVideo(compositionId, props, videoFile, durationInFrames);
      const quality = validateRenderedVideo(videoFile);
      console.log(`   🛡️ Control visual aprobado: ${quality.width}x${quality.height}, ${quality.duration}s, ${(quality.bytes / 1e6).toFixed(2)} MB`);
      if (renderOnly) {
        resultados.push({
          orden: item._orden,
          tipo: item._tipo_contenido,
          plantilla: compositionId,
          gancho: item.gancho,
          fuente: item._fuente,
          fuente_url: item._fuente_url,
          archivo_local: videoFile,
          calidad: quality,
          estado: 'RENDERED_LOCAL',
        });
        console.log('   🧪 Render local validado; subida omitida por RENDER_ONLY=true.');
        continue;
      }

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
    modo: renderOnly ? 'render-only' : 'publish',
    exitosos: resultados.filter(r => r.estado === 'OK').length,
    renderizados_locales: resultados.filter(r => r.estado === 'RENDERED_LOCAL').length,
    errores: resultados.filter(r => r.estado === 'ERROR').length,
    videos: resultados,
  };
  fs.mkdirSync('out', { recursive: true });
  fs.writeFileSync(`out/reporte-${fecha}.json`, JSON.stringify(reporte, null, 2));

  console.log('\n\n══════════════════════════════════════');
  console.log('📊 RESUMEN DEL DÍA');
  console.log('══════════════════════════════════════');
  console.log(`✅ Publicados: ${reporte.exitosos}/${reporte.total}`);
  if (renderOnly) console.log(`🧪 Renderizados localmente: ${reporte.renderizados_locales}/${reporte.total}`);
  if (reporte.errores > 0) console.log(`❌ Errores:  ${reporte.errores}`);
  resultados.filter(r => r.estado === 'OK').forEach(r =>
    console.log(`   ${r.orden}. [${r.plantilla || r.tipo}] ${r.gancho} → ${r.youtube_url}`)
  );

  const completados = renderOnly ? reporte.renderizados_locales : reporte.exitosos;
  if (reporte.errores > 0 || completados !== reporte.total) {
    console.error(renderOnly
      ? `\n❌ Renderizado local incompleto: ${reporte.renderizados_locales}/${reporte.total} videos renderizados.`
      : `\n❌ Publicación incompleta: ${reporte.exitosos}/${reporte.total} videos publicados.`);
    process.exitCode = 1;
    return;
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('\n❌ Error fatal:', err.message);
    process.exit(1);
  });
}

module.exports = { normalizarNombreEquipo, esMismoEquipo, esEtiquetaEditorialGenerica };
