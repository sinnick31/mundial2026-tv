/**
 * Editorial quality gate: blocks stale, source-less or thin scripts before rendering.
 * This does not claim to verify truth automatically; it checks traceability and minimum editorial quality.
 */
const fs = require('fs');

const FILE = 'daily-content.json';
const MAX_AGE_HOURS = 72;
const MIN_WORDS = 45;
const MIN_CHARS = 180;

function fail(message) {
  console.error(`❌ BLOQUEO EDITORIAL: ${message}`);
  process.exitCode = 1;
}

function clean(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function main() {
  if (!fs.existsSync(FILE)) return fail('No existe daily-content.json');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return fail('daily-content.json no contiene JSON válido');
  }

  if (!Number.isInteger(data.total) || !Array.isArray(data.contenido) || data.total !== data.contenido.length) {
    return fail('El total no coincide con el paquete de contenido');
  }
  if (data.total === 0) {
    console.log('ℹ️ No hay historias nuevas; no se publicará relleno.');
    return;
  }

  const seen = new Set();
  const now = Date.now();
  let errors = 0;

  for (const [index, item] of data.contenido.entries()) {
    const label = `Pieza ${index + 1}`;
    const sourceUrl = String(item._fuente_url || '');
    const title = clean(item.titulo_youtube);
    const narration = clean(item.narracion);
    const words = narration ? narration.split(/\s+/).length : 0;
    const publishedAt = item._timestamp_fuente || item.timestamp || item._fecha_publicacion_iso || null;

    if (!/^https?:\/\//i.test(sourceUrl)) { console.error(`❌ ${label}: URL de fuente inválida`); errors++; }
    if (!clean(item._fuente)) { console.error(`❌ ${label}: falta el nombre de la fuente`); errors++; }
    if (!title || title.length > 100) { console.error(`❌ ${label}: título vacío o superior a 100 caracteres`); errors++; }
    if (!narration || narration.length < MIN_CHARS || words < MIN_WORDS) {
      console.error(`❌ ${label}: guion demasiado corto (${words} palabras)`); errors++;
    }
    if (/\b(TODO|INSERTAR|PLACEHOLDER|undefined|null)\b/i.test(`${title} ${narration}`)) {
      console.error(`❌ ${label}: contiene texto de plantilla sin resolver`); errors++;
    }
    if (/\bes oficial\b/i.test(title) && !/\b(oficial|confirmado|confirma)\b/i.test(clean(item._noticia_original))) {
      console.error(`❌ ${label}: el título afirma oficialidad sin respaldo visible en el titular fuente`); errors++;
    }
    if (seen.has(sourceUrl)) { console.error(`❌ ${label}: fuente duplicada en el mismo lote`); errors++; }
    seen.add(sourceUrl);

    if (publishedAt) {
      const ts = new Date(publishedAt).getTime();
      if (!Number.isFinite(ts)) { console.error(`❌ ${label}: fecha de fuente inválida`); errors++; }
      else {
        const ageHours = (now - ts) / 3600000;
        if (ageHours > MAX_AGE_HOURS) { console.error(`❌ ${label}: noticia de ${ageHours.toFixed(1)} horas, supera el límite de ${MAX_AGE_HOURS}h`); errors++; }
        if (ageHours < -6) { console.error(`❌ ${label}: la fecha de fuente está demasiado en el futuro`); errors++; }
      }
    }
  }

  if (errors) {
    console.error(`⛔ ${errors} problema(s). No se debe renderizar ni publicar este lote.`);
    process.exitCode = 1;
    return;
  }
  console.log(`✅ GATE EDITORIAL OK: ${data.total} pieza(s), fuentes trazables, guiones con contexto y sin plantillas vacías.`);
}

main();
