/** scripts/script_generator.js — Guion de locutor deportivo chileno vía Abacus.AI evaluatePrompt (REST). */
const fs = require('fs');
const path = require('path');
const date = process.env.RUN_DATE || new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' });
const edition = process.env.EDITION || 'manana';
const log = (...a) => console.log('[script]', ...a);

async function callAbacus(prompt, system) {
  const key = process.env.ABACUS_API_KEY;
  if (!key) throw new Error('Falta ABACUS_API_KEY');
  const res = await fetch('https://api.abacus.ai/api/v0/evaluatePrompt', {
    method: 'POST', headers: { 'Content-Type': 'application/json', apiKey: key },
    body: JSON.stringify({ prompt, systemMessage: system, maxTokens: 1800, temperature: 0.6 }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.success === false) throw new Error(`Abacus HTTP ${res.status}: ${j.error || ''}`);
  return (j.result && (j.result.content || j.result)) || '';
}

function fallback(news) {
  return [`¡Muy buenas, buenas! Bienvenidos a las noticias del fútbol chileno de este ${date}.`,
    ...news.map((n, i) => `Noticia ${i + 1}: ${n.title}. Según ${n.fuente_original || n.feed}.`),
    'Eso es todo por hoy. ¡Suscríbete, activa la campanita y nos vemos en la próxima edición!'].join('\n\n');
}

async function main() {
  const { noticias = [] } = JSON.parse(fs.readFileSync(process.env.NEWS_OUT || 'news_today.json', 'utf8'));
  if (!noticias.length) { log('Sin noticias nuevas; se omite.'); fs.writeFileSync('pipeline_state.json', JSON.stringify({ hay_contenido: false })); return; }
  const top = noticias.slice(0, 5);
  const facts = top.map((n, i) => `${i + 1}. [${n.categoria_feed}] ${n.title} — ${n.description?.replace(/<[^>]+>/g, '').slice(0, 300)} (Fuente: ${n.fuente_original || n.feed}, ${n.pubDate || 's/f'})`).join('\n');
  const system = 'Eres un locutor deportivo chileno carismático. Escribes en español de Chile, para ser leído en voz alta (sin emojis, sin markdown, sin acotaciones). NUNCA inventes resultados, cifras, citas ni fichajes: usa solo los hechos entregados y atribuye la fuente. Distingue rumores de hechos.';
  const prompt = `Edición de ${edition === 'noche' ? 'la noche' : 'la mañana'} del ${date}. Escribe un guion de 2 a 3 minutos con: 1) intro llamativa; 2) desarrollo de las ${top.length} noticias en orden (prioriza fútbol chileno masculino y femenino); 3) cierre invitando a suscribirse y activar la campanita. Noticias:\n${facts}`;
  let text;
  try { text = String(await callAbacus(prompt, system)).trim(); log('Guion IA generado'); }
  catch (e) { log('WARN IA no disponible, uso plantilla:', e.message); text = fallback(top); }
  fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true });
  const out = path.join(__dirname, 'output', `${date}.txt`);
  fs.writeFileSync(out, text);
  fs.writeFileSync('pipeline_state.json', JSON.stringify({ hay_contenido: true, date, edition, script: out, headline: top[0].title, noticias: top }, null, 2));
  log('→', out);
}
main().catch(e => { console.error('[script] ERROR', e); process.exit(1); });
