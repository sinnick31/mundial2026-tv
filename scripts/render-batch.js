/**
 * render-batch.js
 * ─────────────────────────────────────────────────────────────────────────
 * Lee matches.json y renderiza un Short por cada partido terminado.
 * Usado por GitHub Actions después de check-finished-matches.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const MATCHES_FILE = process.env.MATCHES_FILE || "/tmp/matches.json";
const OUT_DIR = path.join(__dirname, "..", "out");

if (!fs.existsSync(MATCHES_FILE)) {
  console.log("⏳ No hay matches.json — nada que renderizar.");
  process.exit(0);
}

const matches = JSON.parse(fs.readFileSync(MATCHES_FILE, "utf-8"));

if (!matches.length) {
  console.log("⏳ Lista de partidos vacía.");
  process.exit(0);
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const results = [];

for (const match of matches) {
  const safeName = (s) => s.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
  const filename = `ResultadoShorts_${safeName(match.homeTeam)}_vs_${safeName(match.awayTeam)}.mp4`;
  const outFile = path.join(OUT_DIR, filename);

  console.log(`\n🎬 Renderizando: ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`);

  const propsJson = JSON.stringify(match).replace(/'/g, "'\\''");

  try {
    execSync(
      `npx remotion render ResultadoShorts "${outFile}" --props='${propsJson}' --codec=h264 --gl=angle`,
      { stdio: "inherit", cwd: path.join(__dirname, "..") }
    );

    console.log(`✅ OK: ${filename}`);
    results.push({ match, file: outFile, success: true });
  } catch (err) {
    console.error(`❌ Error renderizando ${filename}:`, err.message);
    results.push({ match, file: outFile, success: false });
  }
}

// Guardar resultados para el siguiente step de GitHub Actions
const outputFile = process.env.GITHUB_OUTPUT || "/tmp/github_output";
const successful = results.filter((r) => r.success);

fs.appendFileSync(outputFile, `rendered_count=${successful.length}\n`);

if (successful.length > 0) {
  // Guardar lista de archivos generados
  const filesJson = JSON.stringify(successful.map((r) => ({
    file: r.file,
    match: r.match,
  })));
  fs.writeFileSync("/tmp/rendered-files.json", filesJson, "utf-8");
  fs.appendFileSync(outputFile, `has_renders=true\n`);
  console.log(`\n🎉 ${successful.length}/${matches.length} video(s) renderizados.`);
} else {
  fs.appendFileSync(outputFile, `has_renders=false\n`);
  console.log("\n⚠️ Ningún video se renderizó exitosamente.");
}
