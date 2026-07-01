#!/usr/bin/env node
/**
 * render.js — Script de render para automatización con Make.com
 * ─────────────────────────────────────────────────────────────
 * Uso:
 *   node render.js --props='{"homeTeam":"BRASIL","awayTeam":"ARGENTINA",...}'
 *   node render.js --propsFile=./payload.json
 *
 * Make.com lo llama via HTTP module o Run a Script module con las props
 * del partido en formato JSON.
 *
 * Output: ./out/ResultadoShorts_[homeTeam]_vs_[awayTeam].mp4
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// ── Parsear argumentos ────────────────────────────────────────────────────
const args = process.argv.slice(2);
let props = null;

for (const arg of args) {
  if (arg.startsWith("--props=")) {
    props = JSON.parse(arg.slice(8)); // Más seguro que replace
  } else if (arg.startsWith("--propsFile=")) {
    const file = arg.slice(12); // Más seguro que replace
    props = JSON.parse(fs.readFileSync(path.resolve(file), "utf-8"));
  }
}

if (!props) {
  console.error("❌ Error: Debes pasar --props='{...}' o --propsFile=./payload.json");
  process.exit(1);
}

// ── Validar props requeridas ──────────────────────────────────────────────
const required = [
  "homeTeam", "awayTeam", "homeScore", "awayScore",
  "homeFlag", "awayFlag", "homeColor", "awayColor",
  "matchDate", "matchStage", "venue", "city"
];

const missing = required.filter(k => props[k] === undefined || props[k] === null);
if (missing.length > 0) {
  console.error(`❌ Faltan props requeridas: ${missing.join(", ")}`);
  process.exit(1);
}

// ── Generar nombre de archivo de salida ───────────────────────────────────
const outDir = path.join(__dirname, "out");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const safeName = (s) => s.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
const outFile = path.join(
  outDir,
  `ResultadoShorts_${safeName(props.homeTeam)}_vs_${safeName(props.awayTeam)}_${Date.now()}.mp4`
);

// ── Ejecutar render ───────────────────────────────────────────────────────
console.log(`🎬 Renderizando: ${props.homeTeam} ${props.homeScore} - ${props.awayScore} ${props.awayTeam}`);
console.log(`📁 Output: ${outFile}`);

const propsJson = JSON.stringify(props);
// Escapar comillas simples para evitar inyección de comandos
const escapedPropsJson = propsJson.replace(/'/g, "'\\''");
const cmd = `npx remotion render ResultadoShorts "${outFile}" --props='${escapedPropsJson}' --codec=h264`;

try {
  execSync(cmd, { stdio: "inherit", cwd: __dirname });
  console.log(`✅ Render completado: ${outFile}`);
  
  // Output para Make.com (leer el path del archivo generado)
  const result = {
    success: true,
    outputFile: outFile,
    match: `${props.homeTeam} ${props.homeScore}-${props.awayScore} ${props.awayTeam}`,
    stage: props.matchStage,
  };
  console.log("MAKE_OUTPUT:" + JSON.stringify(result));
} catch (err) {
  console.error("❌ Error en el render:", err.message);
  process.exit(1);
}
