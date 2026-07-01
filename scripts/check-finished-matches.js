/**
 * check-finished-matches.js
 * ─────────────────────────────────────────────────────────────────────────
 * Consulta football-data.org para obtener partidos del Mundial 2026
 * que terminaron en las últimas 2 horas.
 * Guarda el resultado en GitHub Actions output para el siguiente paso.
 *
 * API Free: https://www.football-data.org/  (plan gratuito: 10 req/min)
 * World Cup 2026 Competition ID: WC (a confirmar cuando arranque el torneo)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const COMPETITION_ID = process.env.COMPETITION_ID || "WC";
const OUTPUT_FILE = process.env.GITHUB_OUTPUT || "/tmp/github_output";

if (!API_KEY) {
  console.error("❌ Falta FOOTBALL_DATA_API_KEY en las variables de entorno");
  process.exit(1);
}

// Importar datos compartidos de equipos
const { TEAM_FLAGS, TEAM_COLORS, STAGE_MAP, VENUE_MAP, formatDate, formatStage } = require("../utils/teamData");

// ── Fetch helpers ─────────────────────────────────────────────────────────

function fetchAPI(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.football-data.org",
      path,
      method: "GET",
      headers: { "X-Auth-Token": API_KEY },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error("JSON parse error: " + data));
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}



// ── Proceso principal ──────────────────────────────────────────────────────

async function main() {
  console.log("🔍 Consultando partidos terminados del Mundial 2026...");

  // Ventana de tiempo: últimas 3 horas
  const now = new Date();
  const from = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const dateFrom = from.toISOString().split("T")[0];
  const dateTo = now.toISOString().split("T")[0];

  const url = `/v4/competitions/${COMPETITION_ID}/matches?status=FINISHED&dateFrom=${dateFrom}&dateTo=${dateTo}`;

  let data;
  try {
    data = await fetchAPI(url);
  } catch (err) {
    console.error("❌ Error consultando API:", err.message);
    process.exit(1);
  }

  if (!data.matches || data.matches.length === 0) {
    console.log("⏳ No hay partidos terminados en las últimas 3 horas.");
    // Escribir output vacío para GitHub Actions
    fs.appendFileSync(OUTPUT_FILE, "matches_found=false\n");
    fs.appendFileSync(OUTPUT_FILE, "matches_json=[]\n");
    return;
  }

  console.log(`✅ ${data.matches.length} partido(s) encontrado(s)!`);

  // Mapear a formato ResultadoShorts
  const matches = data.matches.map((match) => {
    const home = match.homeTeam?.name || "LOCAL";
    const away = match.awayTeam?.name || "VISITANTE";

    return {
      homeTeam: home.toUpperCase(),
      awayTeam: away.toUpperCase(),
      homeScore: match.score?.fullTime?.home ?? 0,
      awayScore: match.score?.fullTime?.away ?? 0,
      homeFlag: TEAM_FLAGS[home] || "🏳️",
      awayFlag: TEAM_FLAGS[away] || "🏳️",
      homeColor: TEAM_COLORS[home] || "#ffffff",
      awayColor: TEAM_COLORS[away] || "#cccccc",
      matchDate: formatDate(match.utcDate),
      matchStage: formatStage(match),
      venue: match.venue || "Estadio FIFA",
      city: VENUE_MAP[match.venue] || "USA / CAN / MEX",
    };
  });

  matches.forEach((m) => {
    console.log(
      `  ⚽ ${m.homeTeam} ${m.homeScore} - ${m.awayScore} ${m.awayTeam} (${m.matchStage})`
    );
  });

  // Escribir output para GitHub Actions
  const matchesJson = JSON.stringify(matches);
  fs.appendFileSync(OUTPUT_FILE, `matches_found=true\n`);
  fs.appendFileSync(OUTPUT_FILE, `matches_json=${matchesJson}\n`);
  fs.appendFileSync(OUTPUT_FILE, `match_count=${matches.length}\n`);

  // También guardar como archivo para el siguiente job
  fs.writeFileSync("/tmp/matches.json", matchesJson, "utf-8");
  console.log("📝 matches.json guardado para el render.");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
