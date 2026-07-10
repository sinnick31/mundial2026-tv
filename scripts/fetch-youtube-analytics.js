/**
 * fetch-youtube-analytics.js
 *
 * Consulta datos REALES de rendimiento (YouTube Analytics API) de los
 * ultimos Shorts publicados y los cruza con content-history.json para
 * alimentar style-memory.json con patrones de alto/bajo rendimiento.
 *
 * Esto es lo unico que debe decidir que "aprendio" el pipeline: nunca se
 * inventan metricas ni resultados de partidos. Si no hay credenciales o
 * el scope de Analytics no esta autorizado, el script no rompe el
 * pipeline: solo avisa por consola y deja style-memory.json sin cambios.
 *
 * Requiere las mismas credenciales OAuth que ya usa render-and-upload.js
 * (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN), con
 * el scope adicional autorizado en el refresh token:
 *   https://www.googleapis.com/auth/yt-analytics.readonly
 *
 * Uso:
 *   node scripts/fetch-youtube-analytics.js
 */

const fs = require('fs');
const { google } = require('googleapis');
const { loadMemory, saveMemory, registrarPatron } = require('./style-memory');

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN;

// Umbrales sobre RETENCION REAL (averageViewPercentage de YouTube Analytics).
const UMBRAL_RETENCION_BAJA = 30; // %  - por debajo, se marca bajo rendimiento
const UMBRAL_RETENCION_ALTA = 55; // %  - por encima, se marca alto rendimiento
const DIAS_VENTANA = 10; // cuantos dias hacia atras se consultan

function loadContentHistory() {
  try {
    return JSON.parse(fs.readFileSync('content-history.json', 'utf8'));
  } catch {
    return { items: [] };
  }
}

function getAuthClient() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) return null;
  const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  return oAuth2Client;
}

async function fetchChannelId(auth) {
  const youtube = google.youtube({ version: 'v3', auth });
  const res = await youtube.channels.list({ part: 'id', mine: true });
  return res.data.items?.[0]?.id || null;
}

async function fetchRecentShortsPerformance(auth, channelId) {
  const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - DIAS_VENTANA * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];

  const res = await youtubeAnalytics.reports.query({
    ids: `channel==${channelId}`,
    startDate,
    endDate,
    metrics: 'averageViewPercentage,impressions,impressionsClickThroughRate',
    dimensions: 'video',
    sort: '-impressions',
    maxResults: 25,
  });

  return res.data.rows || []; // cada fila: [videoId, retencion, impresiones, ctr]
}

async function run() {
  const auth = getAuthClient();
  if (!auth) {
    console.log('fetch-youtube-analytics: faltan credenciales de YouTube. Se omite el analisis real de rendimiento.');
    return;
  }

  try {
    const channelId = await fetchChannelId(auth);
    if (!channelId) {
      console.log('fetch-youtube-analytics: no se pudo obtener el canal. Se omite.');
      return;
    }

    const filas = await fetchRecentShortsPerformance(auth, channelId);
    if (!filas.length) {
      console.log('fetch-youtube-analytics: sin datos de Analytics disponibles todavia.');
      return;
    }

    const history = loadContentHistory();
    const memory = loadMemory();
    let analizados = 0;

    filas.forEach(([videoId, retencion, , ctr]) => {
      const item = history.items.find(i => i.video_id === videoId);
      if (!item) return; // sin registro local no podemos asociar el gancho real

      const esBueno = retencion >= UMBRAL_RETENCION_ALTA;
      const esMalo = retencion <= UMBRAL_RETENCION_BAJA;
      if (!esBueno && !esMalo) return; // rendimiento intermedio, no aporta señal clara

      registrarPatron(memory, {
        gancho: item.hook,
        tipoContenido: item.tipo_contenido,
        retencionPromedio: retencion,
        ctr,
        esBueno,
      });
      analizados += 1;
    });

    saveMemory(memory);
    console.log(`fetch-youtube-analytics: style-memory.json actualizado con ${analizados} video(s) con señal clara de ${filas.length} analizado(s).`);
  } catch (err) {
    console.error(`fetch-youtube-analytics: error consultando Analytics real: ${err.message}`);
  }
}

run();
