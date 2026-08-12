/**
 * generate-longform-content.js
 * Crea un resumen largo con varias fuentes reales, pensado para 4-8 min.
 * No inventa resultados, cifras ni declaraciones.
 */

const fs = require('fs');
const { loadHistory } = require('./content-history');

const FECHA = new Date().toISOString().split('T')[0];

function readNews() {
  try { return JSON.parse(fs.readFileSync('news-cache.json', 'utf8')).noticias || []; }
  catch (_) { return []; }
}
function clean(s='') {
  return String(s).replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
}
function norm(s='') { return clean(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function ageHours(n) { return Math.max(0,(Date.now()-new Date(n.timestamp||Date.now()).getTime())/36e5); }
function colo(n) { return /colo colo|colocolo|cacique|albos/i.test(norm(`${n.title} ${n.description}`)); }
function chile(n) { return /liga de primera|primera division|campeonato nacional|liga de ascenso|primera b|segunda division|copa chile|copa de la liga|supercopa|liga femenina|ascenso femenino|tercera a|tercera b|futsal|anfp|anfa/i.test(norm(`${n.title} ${n.description}`)); }
function exterior(n) { return n.categoria === 'chilenos_exterior' || /futbolistas chilenos|jugador chileno|chilenos en el extranjero|alexis sanchez|ben brereton|dario osorio|marcelino nunez|gabriel suazo/i.test(norm(`${n.title} ${n.description}`)); }
function score(n) { return Number(n.viral_score||0) + (colo(n)?100:0) + (chile(n)?40:0) + (exterior(n)?35:0) + Number(n.prioridad_fuente||0)/2 - ageHours(n); }
function snippet(n) {
  const d = clean(n.description || '');
  if (d.length >= 90) return d.slice(0,240).replace(/\s+\S*$/,'') + '.';
  return clean(n.title).slice(0,200);
}

function main() {
  const news = readNews().filter(n => n.link && ageHours(n) <= 72);
  const history = loadHistory();
  const topicsUsed = new Set((history.items||[]).slice(-30).map(x=>clean(x.hook||'')));
  const candidates = news.filter(n => !topicsUsed.has(clean(n.title))).sort((a,b)=>score(b)-score(a));

  const picks = [];
  const used = new Set();
  function pick(predicate) {
    const n = candidates.find(x => predicate(x) && !used.has(x.link));
    if (!n) return;
    used.add(n.link); picks.push(n);
  }
  pick(colo);
  pick(chile);
  pick(chile);
  pick(exterior);
  for (const n of candidates) {
    if (picks.length >= 6) break;
    if (!used.has(n.link)) { used.add(n.link); picks.push(n); }
  }

  if (picks.length < 3) {
    fs.writeFileSync('daily-longform.json', JSON.stringify({fecha:FECHA,total:0,contenido:null},null,2));
    console.log('ℹ️ Menos de 3 fuentes distintas: no se genera resumen largo.');
    return;
  }

  const sections = picks.map((n,i)=>({
    orden:i+1,
    titulo: clean(n.title).slice(0,110),
    cuerpo: `${snippet(n)} ${colo(n) ? 'La prioridad editorial es Colo-Colo: se explica qué significa esta novedad para el Cacique.' : exterior(n) ? 'También miramos cómo esta noticia afecta el seguimiento de futbolistas chilenos fuera del país.' : 'Se pone la noticia en contexto dentro del fútbol chileno y su calendario.'}`,
    fuente: n.fuente || n.fuente_host || 'Fuente deportiva',
    url: n.link,
    fecha_fuente: n.pubDate || n.timestamp || FECHA,
  }));

  const output = {
    fecha: FECHA,
    total: sections.length,
    titulo: `Resumen del fútbol chileno: Colo-Colo, campeonato y chilenos por el mundo | ${FECHA}`,
    intro: `Hoy reunimos ${sections.length} historias verificables del fútbol chileno. La edición prioriza Colo-Colo, sigue el calendario nacional y revisa a los futbolistas chilenos que compiten fuera del país.`,
    sections,
    description: `Resumen editorial basado en fuentes publicadas durante las últimas 72 horas. El contenido separa los hechos de la lectura del canal y enlaza las fuentes originales.\n\n#FutbolChileno #ColoColo #Chile #Futbol`,
  };
  fs.writeFileSync('daily-longform.json', JSON.stringify(output,null,2));
  console.log(`✅ Resumen largo preparado con ${sections.length} fuentes reales.`);
}
main();
