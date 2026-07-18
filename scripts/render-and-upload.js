/**
 * render-and-upload.js v4.1
 * ────────────────────────────────────────────────────────────────────────
 * Renderiza videos del daily-content.json y los sube a YouTube.
 * Itera sobre todos los contenidos generados.
 *
 * ✅ MEJORAS v4.1:
 * - Continúa aunque falle un video (no bloquea el pipeline)
 * - Mejor manejo de errores en renderizado
 * - Registra qué videos fallaron para revisión
 * - Respeta los timeouts de Remotion
 * - Output claro para GitHub Actions
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "out");
const DAILY_CONTENT_FILE = "daily-content.json";
const RENDERED_MANIFEST = "/tmp/rendered-manifest.json";

// ─── Crear directorio de salida ────────────────────────────────────────────
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// ─── Cargar contenido del día ──────────────────────────────────────────────

function loadDailyContent() {
  try {
    if (!fs.existsSync(DAILY_CONTENT_FILE)) {
      console.log("⏳ daily-content.json no existe — nada que renderizar.");
      process.exit(0);
    }
    return JSON.parse(fs.readFileSync(DAILY_CONTENT_FILE, "utf-8"));
  } catch (err) {
    console.error("❌ Error cargando daily-content.json:", err.message);
    process.exit(1);
  }
}

// ─── Sanitizar nombre de archivo ──────────────────────────────────────────

function safeName(s) {
  return String(s || "video")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toUpperCase()
    .substring(0, 40);
}

// ─── Renderizar un video ──────────────────────────────────────────────────

function renderVideo(compositionId, props, filename, attemptNumber = 1) {
  const outFile = path.join(OUT_DIR, filename);
  const propsJson = JSON.stringify(props).replace(/'/g, "'\\''");
  const cmd = `npx remotion render ${compositionId} "${outFile}" --props='${propsJson}' --codec=h264 --gl=angle`;

  console.log(`\n🎬 [${attemptNumber}/1] Renderizando: ${compositionId}`);
  console.log(`   Props: ${JSON.stringify(props).substring(0, 100)}...`);

  try {
    execSync(cmd, {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
      timeout: 600000, // 10 minutos
    });
    console.log(`✅ Renderizado exitoso: ${filename}`);
    return { file: outFile, success: true, props, compositionId };
  } catch (err) {
    console.error(`❌ Fallo renderizando ${compositionId}:`, err.message);
    return { file: outFile, success: false, props, compositionId, error: err.message };
  }
}

// ─── Subir video a YouTube ────────────────────────────────────────────────

async function uploadToYouTube(videoFile, matchData) {
  if (!fs.existsSync(videoFile)) {
    console.error(`❌ Archivo de video no existe: ${videoFile}`);
    return null;
  }

  console.log(`\n📤 Subiendo a YouTube: ${path.basename(videoFile)}`);

  try {
    const env = {
      ...process.env,
      VIDEO_FILE: videoFile,
      MATCH_JSON: JSON.stringify(matchData),
    };

    execSync("node scripts/upload-youtube.js", {
      stdio: "inherit",
      env,
      cwd: path.join(__dirname, ".."),
      timeout: 900000, // 15 minutos
    });

    console.log(`✅ Subida exitosa a YouTube`);
    return true;
  } catch (err) {
    console.error(`❌ Error subiendo a YouTube:`, err.message);
    return false;
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const dailyContent = loadDailyContent();

  if (!dailyContent.contenido || dailyContent.contenido.length === 0) {
    console.log("⏳ No hay contenido para renderizar.");
    fs.writeFileSync(RENDERED_MANIFEST, JSON.stringify({ total: 0, exitosos: 0, fallidos: 0, videos: [] }, null, 2));
    process.exit(0);
  }

  console.log(`\n📊 Renderizando ${dailyContent.contenido.length} video(s)...`);

  const manifest = {
    fecha: dailyContent.fecha,
    total: dailyContent.contenido.length,
    exitosos: 0,
    fallidos: 0,
    videos: [],
  };

  // ─── Renderizar cada contenido ─────────────────────────────────────────

  for (let i = 0; i < dailyContent.contenido.length; i++) {
    const item = dailyContent.contenido[i];
    const label = `[${i + 1}/${dailyContent.contenido.length}] ${item._tipo_contenido} — ${item.gancho}`;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`${label}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Determinar qué composición renderizar según tipo
    let compositionId = "ResultadoShorts"; // default
    if (item._tipo_contenido === "prediccion") compositionId = "PrediccionIA";
    if (item._tipo_contenido === "noticia") compositionId = "NoticiaShortsIA";
    if (item._tipo_contenido === "ranking") compositionId = "RankingShortsIA";

    const filename = `${safeName(item.gancho)}_${Date.now()}.mp4`;

    try {
      // 1. Renderizar
      const renderResult = renderVideo(compositionId, item, filename);

      if (!renderResult.success) {
        manifest.fallidos++;
        manifest.videos.push({
          tipo: item._tipo_contenido,
          gancho: item.gancho,
          status: "render_failed",
          error: renderResult.error,
        });
        console.log(`⚠️ Se omitió este video — continuando con el siguiente...`);
        continue;
      }

      // 2. Subir a YouTube
      const uploadResult = await uploadToYouTube(renderResult.file, item);

      if (uploadResult) {
        manifest.exitosos++;
        manifest.videos.push({
          tipo: item._tipo_contenido,
          gancho: item.gancho,
          status: "success",
          file: renderResult.file,
        });
      } else {
        manifest.fallidos++;
        manifest.videos.push({
          tipo: item._tipo_contenido,
          gancho: item.gancho,
          status: "upload_failed",
        });
      }
    } catch (err) {
      console.error(`❌ Error no controlado:`, err.message);
      manifest.fallidos++;
      manifest.videos.push({
        tipo: item._tipo_contenido,
        gancho: item.gancho,
        status: "error",
        error: err.message,
      });
    }
  }

  // ─── Guardar manifiesto final ──────────────────────────────────────────

  console.log(`\n\n${"═".repeat(50)}`);
  console.log(`📊 RESUMEN FINAL`);
  console.log(`${"═".repeat(50)}`);
  console.log(`✅ Exitosos: ${manifest.exitosos}`);
  console.log(`❌ Fallidos: ${manifest.fallidos}`);
  console.log(`📊 Total: ${manifest.total}`);
  console.log(`${"═".repeat(50)}\n`);

  fs.writeFileSync(RENDERED_MANIFEST, JSON.stringify(manifest, null, 2));

  // Escribir outputs para GitHub Actions
  const outputFile = process.env.GITHUB_OUTPUT || "/tmp/github_output";
  fs.appendFileSync(outputFile, `render_total=${manifest.total}\n`);
  fs.appendFileSync(outputFile, `render_success=${manifest.exitosos}\n`);
  fs.appendFileSync(outputFile, `render_failed=${manifest.fallidos}\n`);

  // Exitcode: 0 si al menos uno fue exitoso
  if (manifest.exitosos === 0 && manifest.fallidos > 0) {
    console.error("⚠️ Todos los videos fallaron.");
    process.exit(1);
  }

  console.log("✅ Render-upload completado.");
}

main().catch((err) => {
  console.error("❌ Error fatal en render-and-upload:", err);
  process.exit(1);
});
