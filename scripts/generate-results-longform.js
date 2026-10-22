/**
 * Resumen horizontal de resultados recientes y próximos encuentros.
 * Usa únicamente datos estructurados de matches-cache.json. No inventa goleadores,
 * estadios ni horarios ausentes en la fuente.
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
const MIN_SECTION_FRAMES = 240;

const norm = (s='') => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const isChile = (m) => /primera division de chile|copa chile|liga de ascenso|futbol chileno|chile/i.test(norm(m.competencia || ''));
const isColo = (m) => /colo colo|colocolo/i.test(norm((m.equipo1 || '') + ' ' + (m.equipo2 || '')));
const wordCount = value => String(value || '').trim().split(/\s+/).filter(Boolean).length;
const fechaLocal = value => {
  if (!value || Number.isNaN(Date.parse(value))) return 'horario no disponible';
  return new Intl.DateTimeFormat('es-CL', {timeZone:'America/Santiago',weekday:'long',day:'2-digit',month:'long',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
};

function loadCache() {
  if (!fs.existsSync(CACHE)) throw new Error('No existe matches-cache.json; la fuente de partidos no se ejecutó.');
  return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
}
function buildSections(cache) {
  const cutoff = Date.now() - 72 * 60 * 60 * 1000;
  const recentRaw = Array.isArray(cache.partidos_recientes) ? cache.partidos_recientes : [];
  const unique = new Map();
  for (const m of recentRaw.filter(m => m.estado === 'finalizado'
    && m.golesLocal !== null && m.golesLocal !== undefined
    && m.golesVisita !== null && m.golesVisita !== undefined
    && (!m.fecha || (Date.parse(m.fecha) >= cutoff && !Number.isNaN(Date.parse(m.fecha)))))) {
    const key = [m.equipo1, m.equipo2, String(m.fecha || '').slice(0,10)].join('|');
    if (!unique.has(key)) unique.set(key, m);
  }
  const recent = [...unique.values()].sort((a,b) =>
    (Number(isColo(b))*100 + Number(isChile(b))*30 + Number(b.prioridad||0))
    - (Number(isColo(a))*100 + Number(isChile(a))*30 + Number(a.prioridad||0))
    || new Date(b.fecha || 0) - new Date(a.fecha || 0)
  ).slice(0, 6).map((m,i) => {
    const scorers = Array.isArray(m.goleadores) ? m.goleadores.filter(Boolean).join(', ') : (m.goleadores || m.scorers || '');
    const scorerText = scorers ? `Goleadores indicados por la fuente: ${scorers}.` : 'La fuente consultada no entrega los nombres de los goleadores; no los inferimos.';
    const venueText = m.estadio ? `Estadio: ${m.estadio}.` : 'El estadio no figura en los datos disponibles.';
    return {
      orden:i+1, tipo:'resultado', titulo:`${m.equipo1} ${m.golesLocal} - ${m.golesVisita} ${m.equipo2}`,
      cuerpo:`Finalizado · ${m.competencia || 'Competencia no especificada'}. ${scorerText} ${venueText}`,
      escudoLocal:m.escudoLocal||'', escudoVisita:m.escudoVisita||'', estadio:m.estadio||'',
      fuente:m.fuente||'Fuente deportiva', url:m.url||'https://www.espn.com/soccer/scoreboard',
    };
  });
  const upcomingRaw = Array.isArray(cache.partidos_proximos) ? cache.partidos_proximos : [];
  const upcoming = upcomingRaw.filter(m => m.equipo1 && m.equipo2 && m.fecha && !Number.isNaN(Date.parse(m.fecha)) && Date.parse(m.fecha) >= Date.now())
    .sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)).slice(0,4).map((m,i)=>({
      orden:recent.length+i+1, tipo:'proximo', titulo:`PRÓXIMO: ${m.equipo1} vs ${m.equipo2}`,
      cuerpo:`Programado para ${fechaLocal(m.fecha)} · ${m.competencia||'Competencia no especificada'}. La programación puede cambiar; confirma el horario con la fuente. ${m.estadio ? `Estadio: ${m.estadio}.` : 'El estadio no aparece en los datos recibidos.'}`,
      escudoLocal:m.escudoLocal||'', escudoVisita:m.escudoVisita||'', estadio:m.estadio||'', fechaTexto:fechaLocal(m.fecha),
      fuente:m.fuente||'Fuente deportiva', url:m.url||'https://www.espn.com/soccer/scoreboard',
    }));
  return {recent, upcoming, sections:[...recent,...upcoming]};
}

async function main() {
  const cache = loadCache();
  const {recent, upcoming, sections} = buildSections(cache);
  if (!sections.length) throw new Error('No hay resultados recientes ni próximos encuentros con datos suficientes. No se publica un video vacío.');
  const title = `FÚTBOL: RESULTADOS Y PRÓXIMAS FECHAS | Chile y el mundo | ${TODAY}`;
  const intro = `Edición de fútbol chileno e internacional. Incluimos ${recent.length} resultados recientes y ${upcoming.length} próximos encuentros encontrados en las fuentes consultadas. Los goleadores y estadios se nombran solo cuando aparecen en los datos recibidos.`;
  const sectionNarration = sections.map((s,i)=>`${s.tipo==='proximo'?'Próximo encuentro':'Resultado final'} ${i+1}. ${s.titulo}. ${s.cuerpo}`);
  const closing = 'Estas son las novedades disponibles en las fuentes enlazadas en la descripción. Las fechas pueden cambiar; revisa la fuente antes de cada encuentro.';
  const narrationBlocks = [title, intro, ...sectionNarration, closing];
  const narration = narrationBlocks.join('\n\n');
  const audioPath = path.join(ROOT, 'public', 'tmp', 'resultados-diarios.wav');
  fs.mkdirSync(path.dirname(audioPath), {recursive:true});
  const audio = await generarNarracion(narration, audioPath, {estilo:'Narrador de prensa deportiva chilena, claro, enérgico y natural. Pronuncia con precisión los nombres y marcadores. No agregues datos que no estén en el guion.'});
  if (!audio.audioPath || !audio.duracionSeg) throw new Error('No se pudo generar la narración; se cancela la publicación para evitar un vídeo sin audio. Revisa GEMINI_API_KEY y el servicio TTS.');
  const audioFrames = Math.ceil((audio.duracionSeg + 0.5) * FPS);
  const weights = sectionNarration.map(wordCount);
  const introWords = wordCount(title) + wordCount(intro);
  const totalWords = narrationBlocks.reduce((sum,block)=>sum+wordCount(block),0) || 1;
  const outroFrames = Math.max(60, Math.round(audioFrames * wordCount(closing) / totalWords));
  const introFrames = Math.max(60, Math.round(audioFrames * introWords / totalWords));
  const sectionBudget = Math.max(MIN_SECTION_FRAMES * sections.length, audioFrames - introFrames - outroFrames);
  const totalSectionWords = weights.reduce((sum,n)=>sum+n,0) || 1;
  const sectionFrames = weights.map(n=>Math.max(MIN_SECTION_FRAMES,Math.round(sectionBudget*n/totalSectionWords)));
  const props = {title,intro,sections,audioSrc:'tmp/resultados-diarios.wav',fuente:'Fuentes deportivas enlazadas en la descripción',introFrames,sectionFrames,outroFrames};
  const durationInFrames = Math.max(900, introFrames + sectionFrames.reduce((sum,n)=>sum+n,0) + outroFrames, audioFrames);
  fs.mkdirSync(path.dirname(OUT), {recursive:true});
  const propsArg = JSON.stringify(props).replace(/'/g, "'\\''");
  execSync(`npx remotion render src/index.tsx ChileLongform "${OUT}" --props='${propsArg}' --duration-in-frames=${durationInFrames} --codec=h264 --fps=30 --width=1920 --height=1080 --concurrency=2`, {cwd:ROOT, stdio:'inherit'});
  const {youtube} = await getAuthenticatedYouTube();
  const channel = await verifyChannel(youtube);
  const sourceList = sections.map(s=>`${s.titulo}\nFuente: ${s.fuente}\n${s.url}`).join('\n\n');
  const description = `${intro}\n\nLos nombres de goleadores y estadios se incluyen solo cuando están disponibles en los datos recibidos. Las fechas programadas pueden cambiar. No se incluyen clips de retransmisión.\n\nFUENTES\n${sourceList}\n\n#FutbolChileno #ColoColo #ResultadosFutbol #ProximosPartidos #FutbolMundial`;
  const privacyStatus = process.env.RESULTS_VIDEO_PRIVACY || 'public';
  const response = await youtube.videos.insert({
    part:['snippet','status'],
    requestBody:{
      snippet:{title,description,tags:['Fútbol chileno','Colo-Colo','Resultados fútbol','Próximos partidos','Fútbol mundial'],categoryId:'17',defaultLanguage:'es'},
      status:{privacyStatus,selfDeclaredMadeForKids:false,madeForKids:false},
    },
    media:{body:fs.createReadStream(OUT)},
  });
  if (!response.data.id) throw new Error('YouTube no devolvió un ID de vídeo.');
  const thumbnailPath = path.join(path.dirname(OUT),'miniatura-resultados.png');
  const thumbnailProps = JSON.stringify({date:TODAY,count:sections.length}).replace(/'/g, "'\\''");
  execSync(`npx remotion still src/index.tsx ResultsThumbnail "${thumbnailPath}" --props='${thumbnailProps}' --frame=0 --scale=1`, {cwd:ROOT,stdio:'inherit'});
  await youtube.thumbnails.set({videoId:response.data.id,media:{mimeType:'image/png',body:fs.createReadStream(thumbnailPath)}});
  const report = {date:TODAY,channelId:channel.id,videoId:response.data.id,url:`https://youtu.be/${response.data.id}`,totalMatches:sections.length,results:recent.length,upcoming:upcoming.length,thumbnailPath,thumbnailUploaded:true,privacyStatus,title};
  fs.writeFileSync(path.join(path.dirname(OUT),'reporte-resultados.json'),JSON.stringify(report,null,2));
  console.log('PUBLICACIÓN CONFIRMADA '+JSON.stringify(report));
}
main().catch(err=>{console.error(err.stack||err);process.exit(1);});
