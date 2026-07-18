/**
 * upload-youtube.js v4.1
 * ────────────────────────────────────────────────────────────────────────
 * Sube un MP4 a YouTube como Short con título, descripción y hashtags
 * automáticamente generados desde los datos del partido.
 *
 * ✅ FIXES v4.1:
 * - Manejo robusto de invalid_grant (refresh token expirado/inválido)
 * - Reintentos exponenciales con backoff (3 intentos máx)
 * - Validación de tokens antes de usar
 * - Mejor logging para debugging
 * - Timeout configurables
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
  console.error("\n📖 Obtén el REFRESH_TOKEN aquí:");
  console.error("   1. Vé a https://console.cloud.google.com/apis/credentials");
  console.error("   2. Crea una credencial OAuth2 de tipo 'Desktop'");
  console.error("   3. Usa google-auth-library para generar el refresh token");
  console.error("   4. Guárdalo en GitHub Secrets como YOUTUBE_REFRESH_TOKEN");
  process.exit(1);
}

if (!VIDEO_FILE || !fs.existsSync(VIDEO_FILE)) {
  console.error("❌ Falta VIDEO_FILE o el archivo no existe:", VIDEO_FILE);
  process.exit(1);
}

// ── Configuración de reintentos ────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // inicio: 1s, luego 2s, 4s

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function getRetryDelay(attemptNumber) {
  return RETRY_DELAY_MS * Math.pow(2, attemptNumber - 1);
}

// ── Obtener Access Token con reintentos ────────────────────────────────────

function getAccessToken(attemptNumber = 1) {
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
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          
          // ✅ Validación: verificar si hay error en la respuesta
          if (json.error) {
            const error = new Error(`OAuth error: ${json.error}`);
            error.oauth_error = json.error;
            error.error_description = json.error_description;
            error.status_code = res.statusCode;
            throw error;
          }
          
          if (!json.access_token) {
            throw new Error("No access_token en respuesta: " + JSON.stringify(json));
          }
          
          console.log(`✅ Access token obtenido (intento ${attemptNumber})`);
          resolve(json.access_token);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout obteniendo access token"));
    });
    
    req.write(body);
    req.end();
  });
}

// ── Wrapper con reintentos automáticos ─────────────────────────────────────

async function getAccessTokenWithRetry() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await getAccessToken(attempt);
    } catch (err) {
      console.error(`❌ Intento ${attempt}/${MAX_RETRIES} falló:`, err.message);
      
      // Si es invalid_grant, es permanente — no reintentar
      if (err.oauth_error === "invalid_grant") {
        console.error("\n🔴 ERROR CRÍTICO: invalid_grant");
        console.error("   El REFRESH_TOKEN está expirado, revocado o es inválido.");
        console.error("   Solución:");
        console.error("   1. Obtén uno nuevo en Google Cloud Console");
        console.error("   2. Actualiza GitHub Secrets con YOUTUBE_REFRESH_TOKEN");
        console.error("   3. Re-ejecuta el workflow");
        process.exit(1);
      }
      
      // Otros errores: reintentar con backoff
      if (attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        console.log(`   ⏳ Reintentando en ${delay}ms...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
}

// ── Generar metadata del video ─────────────────────────────────────────────

function buildVideoMetadata(match) {
  const homeTeam = match.homeTeam || match.equipo1 || "Local";
  const awayTeam = match.awayTeam || match.equipo2 || "Visitante";

  const tags = [
    "futbol",
    "futbol chileno",
    "primera division chile",
    "colo colo",
    "u de chile",
    "champions league",
    "fichajes",
    "Resultado Final",
    "Football",
    "Soccer",
    "Shorts",
    homeTeam,
    awayTeam,
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
      timeout: 15000,
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve(res.headers.location);
      } else {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          const err = new Error(`Initiate upload failed ${res.statusCode}`);
          err.status_code = res.statusCode;
          err.response_body = data;
          reject(err);
        });
      }
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout iniciando upload resumable"));
    });
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
      timeout: 300000, // 5 min para subir el archivo
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const video = JSON.parse(data);
            resolve({
              id: video.id,
              url: `https://youtube.com/shorts/${video.id}`,
            });
          } catch (err) {
            reject(new Error("Error parseando respuesta de upload: " + err.message));
          }
        } else {
          const err = new Error(`Upload file failed ${res.statusCode}`);
          err.status_code = res.statusCode;
          err.response_body = data;
          reject(err);
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout subiendo archivo a YouTube"));
    });
    
    fileStream.pipe(req);

    let uploaded = 0;
    fileStream.on("data", (chunk) => {
      uploaded += chunk.length;
      const pct = Math.round((uploaded / fileSize) * 100);
      process.stdout.write(`\r📤 Subiendo... ${pct}%`);
    });
  });
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const match = MATCH_JSON ? JSON.parse(MATCH_JSON) : {};
  const metadata = buildVideoMetadata(match);
  const fileSize = fs.statSync(VIDEO_FILE).size;

  console.log(`\n📹 Subiendo a YouTube Shorts: ${metadata.title}`);
  console.log(`📁 Archivo: ${VIDEO_FILE} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`);

  try {
    // 1. Obtener access token (con reintentos)
    console.log("🔑 Obteniendo access token...");
    const accessToken = await getAccessTokenWithRetry();

    // 2. Iniciar upload resumable
    console.log("🚀 Iniciando upload...");
    const uploadUrl = await initiateUpload(accessToken, metadata, fileSize);
    console.log(`✅ URL resumable creada`);

    // 3. Subir archivo
    console.log("📤 Subiendo video...");
    const result = await uploadFile(uploadUrl, VIDEO_FILE, fileSize);

    console.log(`\n\n✅ ¡Subido exitosamente!`);
    console.log(`🔗 URL: ${result.url}`);
    console.log(`🆔 ID: ${result.id}`);

    // Output para GitHub Actions
    const outputFile = process.env.GITHUB_OUTPUT || "/tmp/github_output";
    fs.appendFileSync(outputFile, `youtube_url=${result.url}\n`);
    fs.appendFileSync(outputFile, `youtube_id=${result.id}\n`);
    fs.appendFileSync(outputFile, `upload_success=true\n`);
  } catch (err) {
    console.error("\n❌ Error fatal:", err.message);
    if (err.response_body) {
      console.error("   Respuesta del servidor:", err.response_body.substring(0, 500));
    }
    
    const outputFile = process.env.GITHUB_OUTPUT || "/tmp/github_output";
    fs.appendFileSync(outputFile, `upload_success=false\n`);
    fs.appendFileSync(outputFile, `upload_error=${err.message}\n`);
    
    process.exit(1);
  }
}

main();
