/**
 * generate-predictions.js — usa Google Gemini (gratis)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const FOOTBALL_KEY = process.env.FOOTBALL_DATA_API_KEY;
const COMPETITION_ID = process.env.COMPETITION_ID || "WC";

if (!GEMINI_KEY || !FOOTBALL_KEY) {
  console.error("❌ Faltan: GEMINI_API_KEY o FOOTBALL_DATA_API_KEY");
  process.exit(1);
}

// Importar datos compartidos de equipos
const { TEAM_FLAGS, TEAM_COLORS, STAGE_MAP, formatDate, formatStage } = require("../utils/teamData");

async function main() {
  console.log("🔮 Generando predicciones con Gemini AI...");

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24*60*60*1000);
  const dateFrom = now.toISOString().split("T")[0];
  const dateTo = tomorrow.toISOString().split("T")[0];

  const data = await fetchFootball(
    `/v4/competitions/${COMPETITION_ID}/matches?status=SCHEDULED&dateFrom=${dateFrom}&dateTo=${dateTo}`
  );

  const matches = data.matches || [];

  if (!matches.length) {
    console.log("⏳ No hay partidos programados.");
    fs.appendFileSync(process.env.GITHUB_OUTPUT||"/tmp/github_output","predictions_found=false\n");
    return;
  }

  console.log(`📅 ${matches.length} partido(s) encontrado(s)`);
  const predictions = [];

  for (const match of matches) {
    const home = match.homeTeam?.name || "LOCAL";
    const away = match.awayTeam?.name || "VISITANTE";
    const stage = formatStage(match);
    console.log(`\n🤖 Analizando: ${home} vs ${away}...`);

    const prompt = `Eres un analista experto del FIFA World Cup 2026. Analiza: ${home} vs ${away} (${stage}).

Responde SOLO en JSON válido sin texto adicional:
{
  "predictedHome": 2,
  "predictedAway": 1,
  "winner": "${home}",
  "confidence": 68,
  "reasoning": "Frase directa de máx 90 caracteres explicando por qué gana",
  "keyFactor": "Factor decisivo del partido máx 45 chars"
}

Si es empate pon mismo número y winner: "EMPATE". Sé sorprendente si los datos lo justifican.`;

    try {
      const pred = await callGemini(prompt);
      predictions.push({
        homeTeam: home.toUpperCase(),
        awayTeam: away.toUpperCase(),
        homeFlag: TEAM_FLAGS[home] || "🏳️",
        awayFlag: TEAM_FLAGS[away] || "🏳️",
        homeColor: TEAM_COLORS[home] || "#ffffff",
        awayColor: TEAM_COLORS[away] || "#cccccc",
        predictedHome: pred.predictedHome,
        predictedAway: pred.predictedAway,
        winner: pred.winner.toUpperCase(),
        confidence: pred.confidence,
        reasoning: pred.reasoning,
        keyFactor: pred.keyFactor,
        matchDate: formatDate(match.utcDate),
        matchStage: stage,
        venue: match.venue || "Estadio FIFA",
      });
      console.log(`  ✅ ${home} ${pred.predictedHome}-${pred.predictedAway} ${away} (${pred.confidence}%)`);
    } catch(e) {
      console.warn(`  ⚠️ Error: ${e.message}`);
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  if (!predictions.length) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT||"/tmp/github_output","predictions_found=false\n");
    return;
  }

  fs.writeFileSync("/tmp/predictions.json", JSON.stringify(predictions), "utf-8");
  fs.appendFileSync(process.env.GITHUB_OUTPUT||"/tmp/github_output",
    `predictions_found=true\nprediction_count=${predictions.length}\n`);
  console.log(`\n🎉 ${predictions.length} predicciones generadas.`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
