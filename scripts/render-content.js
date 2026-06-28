/**
 * render-content.js
 * ─────────────────────────────────────────────────────────────────────────
 * Renderiza todos los tipos de contenido: predicciones y estadísticas.
 * Lee los JSON generados por generate-predictions.js y generate-stats.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "out");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const rendered = [];

function safeName(s) {
  return String(s).replace(/[^a-zA-Z0-9]/g, "_").toUpperCase().substring(0, 30);
}

function render(compositionId, props, filename) {
  const outFile = path.join(OUT_DIR, filename);
  const propsJson = JSON.stringify(props).replace(/'/g, "'\\''");
  const cmd = `npx remotion render ${compositionId} "${outFile}" --props='${propsJson}' --codec=h264 --gl=angle`;

  console.log(`\n🎬 Renderizando ${compositionId}: ${filename}`);

  try {
    execSync(cmd, { stdio: "inherit", cwd: path.join(__dirname, "..") });
    console.log(`✅ OK: ${filename}`);
    rendered.push({ file: outFile, props, compositionId, success: true });
    return true;
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    rendered.push({ file: outFile, props, compositionId, success: false });
    return false;
  }
}

// ── Renderizar Predicciones ────────────────────────────────────────────────
if (fs.existsSync("/tmp/predictions.json")) {
  const predictions = JSON.parse(fs.readFileSync("/tmp/predictions.json", "utf-8"));
  console.log(`\n🔮 Renderizando ${predictions.length} predicción(es)...`);

  for (const pred of predictions) {
    const filename = `Prediccion_${safeName(pred.homeTeam)}_vs_${safeName(pred.awayTeam)}_${Date.now()}.mp4`;
    render("PrediccionIA", pred, filename);
  }
} else {
  console.log("⏳ No hay predicciones.json");
}

// ── Renderizar Estadística Viral ───────────────────────────────────────────
if (fs.existsSync("/tmp/stat-viral.json")) {
  const stat = JSON.parse(fs.readFileSync("/tmp/stat-viral.json", "utf-8"));
  console.log(`\n📊 Renderizando estadística viral...`);
  const filename = `Estadistica_${safeName(stat.title)}_${Date.now()}.mp4`;
  render("EstadisticaViral", stat, filename);
} else {
  console.log("⏳ No hay stat-viral.json");
}

// ── Guardar manifest ───────────────────────────────────────────────────────
const successful = rendered.filter((r) => r.success);

// Enriquecer con metadata para YouTube
const enriched = successful.map((r) => {
  let youtubeTitle = "";
  let youtubeDescription = "";
  let hashtags = "#Mundial2026 #FIFA #WorldCup2026 #Shorts";

  if (r.compositionId === "PrediccionIA") {
    const p = r.props;
    youtubeTitle = `🤖 IA PREDICE: ${p.homeFlag}${p.homeTeam} ${p.predictedHome}-${p.predictedAway} ${p.awayTeam}${p.awayFlag} | ${p.matchStage} #WorldCup2026`;
    youtubeDescription = [
      `🤖 PREDICCIÓN CON INTELIGENCIA ARTIFICIAL — FIFA World Cup 2026™`,
      ``,
      `${p.homeFlag} ${p.homeTeam} vs ${p.awayFlag} ${p.awayTeam}`,
      `📊 Predicción IA: ${p.predictedHome} - ${p.predictedAway}`,
      `🏆 Ganador predicho: ${p.winner}`,
      `📈 Confianza: ${p.confidence}%`,
      ``,
      `🧠 Análisis: ${p.reasoning}`,
      `⚡ Factor clave: ${p.keyFactor}`,
      ``,
      `📅 ${p.matchDate} | ${p.matchStage}`,
      ``,
      `🔔 Suscríbete para predicciones diarias con IA real`,
      ``,
      `#${p.homeTeam.replace(/\s/g,"")} #${p.awayTeam.replace(/\s/g,"")} ${hashtags} #Prediccion #IA`,
    ].join("\n");
  } else if (r.compositionId === "EstadisticaViral") {
    const s = r.props;
    youtubeTitle = `${s.emoji} ${s.title} | ${s.bigNumber} ${s.bigLabel} #WorldCup2026 #Shorts`;
    youtubeDescription = [
      `📊 DATO VIRAL DEL MUNDIAL 2026`,
      ``,
      `${s.description}`,
      ``,
      `💡 ${s.context}`,
      ``,
      `🔔 Suscríbete para más datos increíbles del Mundial`,
      ``,
      `${hashtags} #DatoViral #Football #Soccer`,
    ].join("\n");
  }

  return {
    ...r,
    youtubeTitle: youtubeTitle.substring(0, 100),
    youtubeDescription,
  };
});

if (enriched.length > 0) {
  fs.writeFileSync("/tmp/content-manifest.json", JSON.stringify(enriched), "utf-8");
  fs.appendFileSync(process.env.GITHUB_OUTPUT || "/tmp/github_output",
    `has_content=true\ncontent_count=${enriched.length}\n`);
  console.log(`\n🎉 ${enriched.length} video(s) listos para subir.`);
} else {
  fs.appendFileSync(process.env.GITHUB_OUTPUT || "/tmp/github_output", "has_content=false\n");
  console.log("\n⚠️ Ningún video generado.");
}
