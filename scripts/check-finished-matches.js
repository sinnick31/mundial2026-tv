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

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const COMPETITION_ID = process.env.COMPETITION_ID || "WC";
const OUTPUT_FILE = process.env.GITHUB_OUTPUT || "/tmp/github_output";

if (!API_KEY) {
  console.error("❌ Falta FOOTBALL_DATA_API_KEY en las variables de entorno");
  process.exit(1);
}

// ── Mapas de datos de equipos ─────────────────────────────────────────────

const TEAM_FLAGS = {
  "Brazil": "🇧🇷", "Argentina": "🇦🇷", "France": "🇫🇷", "Germany": "🇩🇪",
  "Spain": "🇪🇸", "Portugal": "🇵🇹", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Netherlands": "🇳🇱",
  "Belgium": "🇧🇪", "Uruguay": "🇺🇾", "Colombia": "🇨🇴", "Mexico": "🇲🇽",
  "United States": "🇺🇸", "USA": "🇺🇸", "Chile": "🇨🇱", "Ecuador": "🇪🇨",
  "Peru": "🇵🇪", "Japan": "🇯🇵", "South Korea": "🇰🇷", "Australia": "🇦🇺",
  "Morocco": "🇲🇦", "Senegal": "🇸🇳", "Ghana": "🇬🇭", "Nigeria": "🇳🇬",
  "Canada": "🇨🇦", "Saudi Arabia": "🇸🇦", "Iran": "🇮🇷", "Poland": "🇵🇱",
  "Croatia": "🇭🇷", "Serbia": "🇷🇸", "Switzerland": "🇨🇭", "Denmark": "🇩🇰",
  "Austria": "🇦🇹", "Turkey": "🇹🇷", "Ukraine": "🇺🇦", "Hungary": "🇭🇺",
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "Italy": "🇮🇹", "Sweden": "🇸🇪",
  "Costa Rica": "🇨🇷", "Panama": "🇵🇦", "Honduras": "🇭🇳", "Jamaica": "🇯🇲",
  "Algeria": "🇩🇿", "Tunisia": "🇹🇳", "Cameroon": "🇨🇲", "Egypt": "🇪🇬",
  "Qatar": "🇶🇦", "Iraq": "🇮🇶", "Uzbekistan": "🇺🇿", "Indonesia": "🇮🇩",
  "Venezuela": "🇻🇪", "Bolivia": "🇧🇴", "Paraguay": "🇵🇾",
};

const TEAM_COLORS = {
  "Brazil": "#009c3b", "Argentina": "#74acdf", "France": "#002395",
  "Germany": "#1d1d1d", "Spain": "#AA151B", "Portugal": "#006600",
  "England": "#ffffff", "Netherlands": "#FF6600", "Belgium": "#EF3340",
  "Uruguay": "#5EB6E4", "Colombia": "#FCD116", "Mexico": "#006847",
  "United States": "#002868", "USA": "#002868", "Chile": "#D52B1E",
  "Ecuador": "#FFD100", "Peru": "#D91023", "Japan": "#003087",
  "South Korea": "#003478", "Australia": "#00843D", "Morocco": "#C1272D",
  "Senegal": "#00853F", "Ghana": "#006B3F", "Nigeria": "#008751",
  "Canada": "#FF0000", "Saudi Arabia": "#006C35", "Iran": "#239F40",
  "Poland": "#DC143C", "Croatia": "#FF0000", "Serbia": "#C6363C",
  "Switzerland": "#FF0000", "Denmark": "#C60C30", "Austria": "#ED2939",
  "Turkey": "#E30A17", "Ukraine": "#005BBB", "Costa Rica": "#002B7F",
  "Venezuela": "#CF142B", "Bolivia": "#D52B1E", "Paraguay": "#D52B1E",
  "Algeria": "#006233", "Tunisia": "#E70013", "Cameroon": "#007A5E",
};

const STAGE_MAP = {
  "GROUP_STAGE": "FASE DE GRUPOS",
  "LAST_16": "OCTAVOS DE FINAL",
  "QUARTER_FINALS": "CUARTOS DE FINAL",
  "SEMI_FINALS": "SEMIFINAL",
  "THIRD_PLACE": "TERCER PUESTO",
  "FINAL": "FINAL",
};

const VENUE_MAP = {
  "AT&T Stadium": "Dallas, Texas",
  "SoFi Stadium": "Los Ángeles, California",
  "MetLife Stadium": "Nueva York / Nueva Jersey",
  "Levi's Stadium": "San Francisco, California",
  "Arrowhead Stadium": "Kansas City, Missouri",
  "Lincoln Financial Field": "Filadelfia, Pennsylvania",
  "Empower Field at Mile High": "Denver, Colorado",
  "Hard Rock Stadium": "Miami, Florida",
  "Gillette Stadium": "Boston, Massachusetts",
  "NRG Stadium": "Houston, Texas",
  "Lumen Field": "Seattle, Washington",
  "Estadio Azteca": "Ciudad de México",
  "Estadio Guadalajara": "Guadalajara, Jalisco",
  "Estadio BBVA": "Monterrey, Nuevo León",
  "BC Place": "Vancouver, Canadá",
  "BMO Field": "Toronto, Canadá",
};

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

// ── Formatear fecha ────────────────────────────────────────────────────────

function formatDate(isoDate) {
  const date = new Date(isoDate);
  const months = [
    "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
    "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
  ];
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

// ── Formatear grupo ────────────────────────────────────────────────────────

function formatStage(match) {
  const stage = STAGE_MAP[match.stage] || match.stage;
  if (match.stage === "GROUP_STAGE" && match.group) {
    const groupLetter = match.group.replace("GROUP_", "");
    // Calcular jornada (matchday)
    const jornada = match.matchday || 1;
    return `GRUPO ${groupLetter} · JORNADA ${jornada}`;
  }
  return stage;
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
