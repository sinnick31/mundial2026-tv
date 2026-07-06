/**
 * upload-youtube.js
 * ─────────────────────────────────────────────────────────────────────────
 * Sube un MP4 a YouTube como Short con título, descripción y hashtags
 * automáticamente generados desde los datos del partido.
 *
 * Requiere: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN
 * Docs: https://developers.google.com/youtube/v3/guides/uploading_a_video
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const {
  finalResultDescription,
  finalResultTitle,
} = require("./metadata-generator");

// ── Variables de entorno ──────────────────────────────────────────────────
const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN;
const VIDEO_FILE = process.env.VIDEO_FILE; // ruta al .mp4
const MATCH_JSON = process.env.MATCH_JSON; // JSON string del partido

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error("❌ Faltan credenciales de YouTube OAuth2");
  console.error("   Necesitas: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN");
  process.exit(1);
}

if (!VIDEO_FILE || !fs.existsSync(VIDEO_FILE)) {
  console.error("❌ Falta VIDEO_FILE o el archivo no existe:", VIDEO_FILE);
  process.exit(1);
}

// ── Obtener Access Token ───────────────────────────────────────────────────

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    }).toString();

    const options = {
      hostname: "oauth2.googleapis.com",
      path: "/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const json = JSON.parse(data);
        if (json.access_token) {
          resolve(json.access_token);
        } else {
          reject(new Error("No access_token: " + data));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── Generar metadata del video ─────────────────────────────────────────────

function buildVideoMetadata(match) {
  const homeTeam = match.homeTeam || match.equipo1 || "Local";
  const awayTeam = match.awayTeam || match.equipo2 || "Visitante";

  const tags = [
    "FIFA World Cup 2026", "Mundial 2026", "World Cup", "FIFA",
    "Resultado Final", "Football", "Soccer", "Shorts",
    homeTeam, awayTeam,
    "MUNDIAL 2026 TV",
  ];

  return {
    title: finalResultTitle(match),
    description: finalResultDescription(match),
    tags,
  };
}

// ── Upload resumable a YouTube ────────────────────────────────────────────

function initiateUpload(accessToken, metadata, fileSize) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: "17", // Sports
        defaultLanguage: "es",
      },
      status: {
        privacyStatus: "public",
        selfDeclaredMadeForKids: false,
      },
    });

    const options = {
      hostname: "www.googleapis.com",
      path: "/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": fileSize,
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve(res.headers.location);
      } else {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => reject(new Error(`Initiate failed ${res.statusCode}: ${data}`)));
      }
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function uploadFile(uploadUrl, filePath, fileSize) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const url = new URL(uploadUrl);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: "PUT",
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": fileSize,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const video = JSON.parse(data);
          resolve({
            id: video.id,
            url: `https://youtube.com/shorts/${video.id}`,
          });
        } else {
          reject(new Error(`Upload failed ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", reject);
    fileStream.pipe(req);

    let uploaded = 0;
    fileStream.on("data", (chunk) => {
      uploaded += chunk.length;
      const pct = Math.round((uploaded / fileSize) * 100);
      process.stdout.write(`\r📤 Subiendo... ${pct}%`);
    });
  });
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const match = MATCH_JSON ? JSON.parse(MATCH_JSON) : {};
  const metadata = buildVideoMetadata(match);
  const fileSize = fs.statSync(VIDEO_FILE).size;

  console.log(`\n📹 Subiendo a YouTube Shorts: ${metadata.title}`);
  console.log(`📁 Archivo: ${VIDEO_FILE} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`);

  // 1. Obtener access token
  console.log("🔑 Obteniendo access token...");
  const accessToken = await getAccessToken();

  // 2. Iniciar upload resumable
  console.log("🚀 Iniciando upload...");
  const uploadUrl = await initiateUpload(accessToken, metadata, fileSize);

  // 3. Subir archivo
  const result = await uploadFile(uploadUrl, VIDEO_FILE, fileSize);

  console.log(`\n\n✅ ¡Subido exitosamente!`);
  console.log(`🔗 URL: ${result.url}`);
  console.log(`🆔 ID: ${result.id}`);

  // Output para GitHub Actions
  const outputFile = process.env.GITHUB_OUTPUT || "/tmp/github_output";
  fs.appendFileSync(outputFile, `youtube_url=${result.url}\n`);
  fs.appendFileSync(outputFile, `youtube_id=${result.id}\n`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
