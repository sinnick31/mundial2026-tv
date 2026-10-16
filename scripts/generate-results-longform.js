/**
 * Produce un resumen diario horizontal de resultados verificados.
 * Usa matches-cache.json generado por scripts/fetch-matches.js.
 * No inventa marcadores: si las fuentes no entregan resultados, no publica.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getAuthenticatedYouTube, verifyChannel } = require('./youtube-auth');
const { generarNarracion } = require('./generate-narration');

const ROOT = path.join(__dirname, '..');
const TODAY = new Date().toISOString().slice(0, 10);
const CACHE = path.join(ROOT, 'matches-cache.json');
const OUT = path.join(ROOT, 'out', TODAY, 'resumen-resultados.mp4');
const FPS = 30;
const SECTION_FRAMES = 450; // 15 segundos por partido

const norm = (s='') => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const isChile = (m) => /primera division de chile|copa chile|liga de ascenso|futbol chileno|chile/i.test(norm(m.competencia || ''));
const isColo = (m) => /colo colo|colocolo/i.test(norm((m.equipo1 || '') + ' ' + (m.equipo2 || '')));

function mainData() {
  if (!fs.existsSync(CACHE)) throw new Error('No existe matches-cache.json; la fuente de resultados no se ejecutó.');
  const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'));
  const matches = Array.isArray(cache.partidos_recientes) ? cache.partidos_recientes : [];
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recent = matches.filter(m => m.estado === 'finalizado'
    && m.golesLocal !== null && m.golesLocal !== undefined
    && m.golesVisita !== null && m.golesVisita !== undefined
    && (!m.fecha || new Date(m.fecha).getTime() >= cutoff));
  const unique = new Map();
  for (const m of recent) {
    const key = [m.equipo1, m.equipo2, String(m.fecha || '').slice(0,10)].join('|');
    if (!unique.has(key)) unique.set(key, m);
  }
  return [...unique.values()].sort((a,b) =>
    (Number(isColo(b))*100 + Number(isChile(b))*30 + Number(b.prioridad||0))
    - (Number(isColo(a))*100 + Number(isChile(a))*30 + Number(a.prioridad||0))
    || new Date(b.fecha || 0) - new Date(a.fecha || 0)
  ).slice(0, 20);
}

async function main() {
  const matches = mainData();
  if (!matches.length) {
    throw new Error('No hay resultados finalizados verificables en la ventana disponible. No se publica un vídeo vacío; revisar la fuente de resultados y el rango de fechas.');
  }
  const sections = matches.map((m,i) => ({
    orden: i+1,
    titulo: `${m.equipo1} ${m.golesLocal} - ${m.golesVisita} ${m.equipo2}`,
    cuerpo: `Resultado final de ${m.competencia || 'fútbol internacional'}. ${m.equipo1} terminó con ${m.golesLocal} goles y ${m.equipo2} con ${m.golesVisita}. Este marcador se incluye como resultado verificado, sin añadir goleadores ni incidencias que no estén disponibles en la fuente.`,
    fuente: m.fuente || 'ESPN / football-data.org',
    url: m.url || (m.fuente === 'football-data.org' ? 'https://www.football-data.org/' : 'https://www.espn.com/soccer/scoreboard'),
  }));
  const title = `TODOS LOS RESULTADOS DEL FÚTBOL | Chile y el mundo | ${TODAY}`;
  const intro = `Repasamos ${sections.length} resultados finalizados y disponibles en las fuentes consultadas durante las últimas 72 horas. Priorizamos Colo-Colo y el fútbol chileno, y después recorremos el fútbol internacional. Solo mostramos marcadores verificados.`;
  const narration = [title, intro, ...sections.map((s,i)=>`Partido ${i+1}. ${s.titulo}. ${s.cuerpo}`), 'Estos fueron los resultados disponibles en nuestra edición. Revisa las fuentes enlazadas en la descripción y cuéntanos qué partido quieres que analicemos.'].join('\n\n');
  const audioPath = path.join(ROOT, 'public', 'tmp', 'resultados-diarios.wav');
  fs.mkdirSync(path.dirname(audioPath), {recursive:true});
  const audio = await generarNarracion(narration, audioPath, {estilo:'Narrador de prensa deportiva chilena, claro, enérgico y natural. Pronuncia con precisión los nombres y marcadores. No agregues datos que no estén en el guion.'});
  if (!audio.audioPath || !audio.duracionSeg) throw new Error('No se pudo generar la narración; se cancela la publicación para evitar un vídeo silencioso. Revisa GEMINI_API_KEY y el servicio TTS.');
  const audioSrc = audio.audioPath ? 'tmp/resultados-diarios.wav' : undefined;
  const props = { title, intro, sections, audioSrc, fuente: 'Fuentes deportivas enlazadas en la descripción' };
  const sectionDurationInFrames = Math.max(SECTION_FRAMES, Math.ceil(((audio.duracionSeg || 0) + 2) * FPS / sections.length));
  props.sectionDurationInFrames = sectionDurationInFrames;
  const framesBySections = Math.max(1, sections.length) * sectionDurationInFrames;
  const audioFrames = audio.duracionSeg ? Math.ceil((audio.duracionSeg + 2) * FPS) : 0;
  const durationInFrames = Math.max(framesBySections, audioFrames, 900);
  fs.mkdirSync(path.dirname(OUT), {recursive:true});
  const propsArg = JSON.stringify(props).replace(/'/g, "'\\''");
  execSync(`npx remotion render src/index.tsx ChileLongform "${OUT}" --props='${propsArg}' --duration-in-frames=${durationInFrames} --codec=h264 --fps=30 --width=1920 --height=1080 --concurrency=2`, {cwd:ROOT, stdio:'inherit'});
  const {youtube} = await getAuthenticatedYouTube();
  const channel = await verifyChannel(youtube);
  const sourceList = sections.map(s=>`${s.titulo}\nFuente: ${s.fuente}\n${s.url}`).join('\n\n');
  const description = `${intro}\n\nMarcadores recopilados de fuentes deportivas disponibles. No se incluyen clips de retransmisión.\n\nFUENTES\n${sourceList}\n\n#FutbolChileno #ColoColo #ResultadosFutbol #FutbolMundial`;
  const privacyStatus = process.env.RESULTS_VIDEO_PRIVACY || 'unlisted';
  const response = await youtube.videos.insert({
    part:['snippet','status'],
    requestBody:{
      snippet:{title, description, tags:['Fútbol chileno','Colo-Colo','Resultados fútbol','Fútbol mundial'], categoryId:'17', defaultLanguage:'es'},
      status:{privacyStatus, selfDeclaredMadeForKids:false, madeForKids:false},
    },
    media:{body:fs.createReadStream(OUT)},
  });
  if (!response.data.id) throw new Error('YouTube no devolvió un ID de vídeo.');
  const thumbnailPath = path.join(path.dirname(OUT), 'miniatura-resultados.png');
  const thumbnailProps = JSON.stringify({date:TODAY, count:sections.length}).replace(/'/g, "'\\''");
  execSync(`npx remotion still src/index.tsx ResultsThumbnail "${thumbnailPath}" --props='${thumbnailProps}' --frame=0 --scale=1`, {cwd:ROOT, stdio:'inherit'});
  await youtube.thumbnails.set({videoId:response.data.id, media:{mimeType:'image/png', body:fs.createReadStream(thumbnailPath)}});
  const report = {date:TODAY, channelId:channel.id, videoId:response.data.id, url:`https://youtu.be/${response.data.id}`, totalMatches:sections.length, thumbnailPath, thumbnailUploaded:true, privacyStatus, title};
  fs.writeFileSync(path.join(path.dirname(OUT),'reporte-resultados.json'), JSON.stringify(report,null,2));
  console.log('PUBLICACIÓN CONFIRMADA '+JSON.stringify(report));
}
main().catch(err => { console.error(err.stack || err); process.exit(1); });
