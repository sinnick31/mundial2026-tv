/**
 * generate-stats.js — usa Google Gemini (gratis)
 */

const https = require("https");
const fs = require("fs");

const GEMINI_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_KEY) { console.error("❌ Falta GEMINI_API_KEY"); process.exit(1); }

function callGemini(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 400 },
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

async function main() {
  console.log("📊 Generando estadística viral con Gemini AI...");

  const prompt = `Eres experto en fútbol creando contenido viral para YouTube Shorts sobre el Mundial 2026.

Genera UNA estadística sorprendente sobre el Mundial 2026 o historia del fútbol.
Debe ser: impactante, verificable, que motive a compartir, con número llamativo.

Responde SOLO en JSON válido:
{
  "emoji": "🔥",
  "bigNumber": "8",
  "bigLabel": "GOLES EN UN PARTIDO",
  "title": "RÉCORD QUE NADIE CONOCE",
  "description": "Hungría anotó 8 goles vs El Salvador en 1982. El récord sigue en pie hoy.",
  "context": "Brasil tiene el récord de goles en un Mundial: 18 en Francia 1998.",
  "accentColor": "#FF6B35",
  "teamFlag": "🇧🇷",
  "teamName": "BRASIL",
  "category": "DATO VIRAL DEL DÍA"
}

Reglas: title en MAYÚSCULAS máx 35 chars. description máx 100 chars. context máx 90 chars.
Varía el tema cada vez: récords, curiosidades, comparaciones, datos históricos sorprendentes.`;

  try {
    const stat = await callGemini(prompt);
    console.log("✅ Estadística:", stat.title);
    fs.writeFileSync("/tmp/stat-viral.json", JSON.stringify(stat), "utf-8");
    fs.appendFileSync(process.env.GITHUB_OUTPUT||"/tmp/github_output","stat_found=true\n");
  } catch(e) {
    console.error("❌ Error:", e.message);
    fs.appendFileSync(process.env.GITHUB_OUTPUT||"/tmp/github_output","stat_found=false\n");
  }
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
