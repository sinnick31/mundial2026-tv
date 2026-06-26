/**
 * upload-batch.js
 * ─────────────────────────────────────────────────────────────────────────
 * Lee rendered-files.json y sube cada video a YouTube Shorts.
 * Espera 5 segundos entre uploads para respetar rate limits de la API.
 */

const { execSync } = require("child_process");
const fs = require("fs");

const RENDERS_FILE = process.env.RENDERS_FILE || "/tmp/rendered-files.json";

if (!fs.existsSync(RENDERS_FILE)) {
  console.log("⏳ No hay rendered-files.json — nada que subir.");
  process.exit(0);
}

const renders = JSON.parse(fs.readFileSync(RENDERS_FILE, "utf-8"));

if (!renders.length) {
  console.log("⏳ Lista vacía.");
  process.exit(0);
}

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function main() {
  const results = [];

  for (let i = 0; i < renders.length; i++) {
    const { file, match } = renders[i];

    if (!fs.existsSync(file)) {
      console.error(`⚠️ Archivo no encontrado: ${file}`);
      continue;
    }

    console.log(`\n📤 [${i + 1}/${renders.length}] Subiendo: ${match.homeTeam} vs ${match.awayTeam}`);

    try {
      execSync(`node scripts/upload-youtube.js`, {
        stdio: "inherit",
        env: {
          ...process.env,
          VIDEO_FILE: file,
          MATCH_JSON: JSON.stringify(match),
        },
      });

      results.push({ match, success: true });
    } catch (err) {
      console.error(`❌ Error subiendo: ${err.message}`);
      results.push({ match, success: false });
    }

    // Pausa entre uploads
    if (i < renders.length - 1) {
      console.log("⏱️  Esperando 5s antes del siguiente upload...");
      await sleep(5000);
    }
  }

  const ok = results.filter((r) => r.success).length;
  console.log(`\n✅ ${ok}/${renders.length} video(s) subidos a YouTube Shorts.`);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
