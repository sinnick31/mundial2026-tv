/**
 * generate-predictions.js — usa Google Gemini (gratis)
 */

const https = require("https");
const fs = require("fs");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const FOOTBALL_KEY = process.env.FOOTBALL_DATA_API_KEY;
const COMPETITION_ID = process.env.COMPETITION_ID || "WC";

if (!GEMINI_KEY || !FOOTBALL_KEY) {
  console.error("❌ Faltan: GEMINI_API_KEY o FOOTBALL_DATA_API_KEY");
  process.exit(1);
}

const TEAM_FLAGS = {
  "Brazil":"🇧🇷","Argentina":"🇦🇷","France":"🇫🇷","Germany":"🇩🇪",
  "Spain":"🇪🇸","Portugal":"🇵🇹","England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Netherlands":"🇳🇱",
  "Belgium":"🇧🇪","Uruguay":"🇺🇾","Colombia":"🇨🇴","Mexico":"🇲🇽",
  "United States":"🇺🇸","USA":"🇺🇸","Chile":"🇨🇱","Ecuador":"🇪🇨",
  "Peru":"🇵🇪","Japan":"🇯🇵","South Korea":"🇰🇷","Morocco":"🇲🇦",
  "Canada":"🇨🇦","Saudi Arabia":"🇸🇦","Poland":"🇵🇱","Croatia":"🇭🇷",
  "Switzerland":"🇨🇭","Denmark":"🇩🇰","Austria":"🇦🇹","Turkey":"🇹🇷",
  "Serbia":"🇷🇸","Ukraine":"🇺🇦","Italy":"🇮🇹","Costa Rica":"🇨🇷",
  "Senegal":"🇸🇳","Nigeria":"🇳🇬","Cameroon":"🇨🇲","Ghana":"🇬🇭",
  "Venezuela":"🇻🇪","Bolivia":"🇧🇴","Paraguay":"🇵🇾","Algeria":"🇩🇿",
};

const TEAM_COLORS = {
  "Brazil":"#009c3b","Argentina":"#74acdf","France":"#002395",
  "Germany":"#1d1d1d","Spain":"#AA151B","Portugal":"#006600",
  "England":"#00247D","Netherlands":"#FF6600","Belgium":"#EF3340",
  "Uruguay":"#5EB6E4","Colombia":"#FCD116","Mexico":"#006847",
  "United States":"#002868","USA":"#002868","Chile":"#D52B1E",
  "Ecuador":"#FFD100","Peru":"#D91023","Japan":"#003087",
  "South Korea":"#003478","Morocco":"#C1272D","Canada":"#FF0000",
  "Saudi Arabia":"#006C35","Poland":"#DC143C","Croatia":"#FF0000",
  "Switzerland":"#FF0000","Denmark":"#C60C30","Austria":"#ED2939",
  "Turkey":"#E30A17","Serbia":"#C6363C","Ukraine":"#005BBB",
};

const STAGE_MAP = {
  "GROUP_STAGE":"FASE DE GRUPOS","LAST_16":"OCTAVOS DE FINAL",
  "QUARTER_FINALS":"CUARTOS DE FINAL","SEMI_FINALS":"SEMIFINAL",
  "THIRD_PLACE":"TERCER PUESTO","FINAL":"FINAL",
};

function fetchFootball(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.football-data.org", path, method: "GET",
      headers: { "X-Auth-Token": FOOTBALL_KEY },
    }, (res) => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
    });
    req.on("error", reject); req.end();
  });
}

function callGemini(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 400 },
    });
    const path = `/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    const req = https.request({
      hostname: "generativelanguage.googleapis.com", path, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => {
        try {
          const json = JSON.parse(d);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const clean = text.replace(/```json|```/g, "").trim();
          resolve(JSON.parse(clean));
        } catch(e) { reject(new Error("Gemini parse error: " + d.substring(0,200))); }
      });
    });
    req.on("error", reject); req.write(body); req.end();
  });
}

function formatDate(iso) {
  const d = new Date(iso);
  const m = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
  return `${d.getUTCDate()} ${m[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatStage(match) {
  const stage = STAGE_MAP[match.stage] || match.stage;
  if (match.stage === "GROUP_STAGE" && match.group) {
    return `GRUPO ${match.group.replace("GROUP_","")} · JORNADA ${match.matchday||1}`;
  }
  return stage;
}

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
