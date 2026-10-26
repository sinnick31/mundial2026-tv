'use strict';

/**
 * Capa editorial de retención para el paquete diario.
 * Trabaja exclusivamente con el titular y el análisis ya vinculados a una fuente.
 * No convierte preguntas ni hipótesis en hechos confirmados.
 */
const fs = require('node:fs');

function buildRetention(item) {
  const title = String(item._noticia_original || item.titulo_youtube || '').trim();
  const category = String(item._categoria_editorial || 'chile');
  const normalized = title.toLocaleLowerCase('es-CL');
  const isOfficial = /\b(oficial|confirmad[oa]|confirma|anuncia)\b/i.test(title);
  const hook = isOfficial
    ? `¿Qué cambia de verdad con esta noticia confirmada? ${title}`
    : `La pregunta clave es qué cambia ahora: ${title}`;
  const question = category === 'colo_colo'
    ? '¿Qué debería hacer Colo-Colo a partir de esta noticia? Te leo en los comentarios.'
    : category === 'internacional'
      ? '¿Esto cambia el panorama del torneo o todavía es pronto? Te leo en los comentarios.'
      : category === 'chilenos_exterior'
        ? '¿Cómo crees que le afectará esto al chileno involucrado? Te leo en los comentarios.'
        : '¿Qué lectura haces de esta noticia para el fútbol chileno? Te leo en los comentarios.';
  const cta = 'Si quieres seguir el fútbol chileno sin humo y con el análisis al grano fecha tras fecha, suscríbete a Chilensis Fútbol.';
  const base = String(item.narracion || '').trim();
  // El gancho va al principio; el CTA se sitúa después del análisis y antes de la pregunta final.
  const withoutOldQuestion = base.replace(/\s*(?:La pregunta queda abierta:|Ahora queda seguir|¿Qué liga o torneo|La próxima fecha puede entregar)[\s\S]*$/i, '').trim();
  item.gancho = hook.slice(0, 220);
  item.narracion = [hook, withoutOldQuestion, cta, question].filter(Boolean).join(' ');
  item.pregunta_comunidad = question;
  item.cta_suscripcion = cta;
  item.estructura_retencion = {
    gancho_0_a_5s: hook,
    actos: {
      hecho: title,
      analisis: String(item.subtitulo || item.descripcion || ''),
      consecuencia: String(item.puntos?.at(-1) || question),
    },
    cambios_de_ritmo: [
      { momento: '0-5s', objetivo: 'Abrir con una duda o tensión ligada al hecho publicado.' },
      { momento: 'cada 15s', objetivo: 'Introducir contexto, dato confirmado o cambio visual; no inventar estadísticas.' },
      { momento: '70-80%', objetivo: 'Insertar CTA después de entregar el análisis principal.' },
    ],
  };
  const overlay = /lesion|baja|descartad|sancion/i.test(normalized) ? 'BAJA CLAVE'
    : /fichaje|traspaso|refuerzo|renovacion/i.test(normalized) ? '¿LLEGA O NO?'
      : /final|campeon|titulo|clasifica|eliminado/i.test(normalized) ? 'TODO EN JUEGO'
        : /gol|goleada|remontada|resultado/i.test(normalized) ? 'CAMBIÓ TODO'
          : 'LA CLAVE';
  const subject = item.equipo1 && !/fútbol chileno|fútbol mundial|^chile$/i.test(item.equipo1)
    ? `A football player or coach associated with ${String(item.equipo1).slice(0, 80)}, showing a clear authentic expression of tension or determination`
    : 'A football player or coach with a clear authentic expression of tension or determination, without implying a real person likeness';
  item.miniatura = {
    sujeto_principal: subject,
    fondo: 'Estadio de fútbol chileno de noche, tribunas y focos desenfocados, profundidad de campo marcada.',
    texto_en_miniatura: overlay,
    paleta_colores: ['blanco', 'negro', 'rojo intenso', 'amarillo de acento'],
    prompt_generador_imagen: `Create a professional football-news YouTube thumbnail, 16:9 landscape. ${subject}. Blurred night football stadium background, dramatic stadium floodlights, high contrast complementary colors, sharp subject separation, authentic sports editorial photography, clean composition readable on a phone, leave clear negative space for the exact Spanish overlay text "${overlay}". No logos unless supplied as licensed assets, no fake headlines, no watermarks, no extra text, no fabricated match score.`,
  };
  return item;
}

function enrichPackage(pkg) {
  if (!pkg || !Array.isArray(pkg.contenido)) throw new Error('daily-content.json debe contener un arreglo contenido');
  pkg.contenido = pkg.contenido.map(buildRetention);
  return pkg;
}

if (require.main === module) {
  const file = process.argv[2] || 'daily-content.json';
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  enrichPackage(pkg);
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`RETENCIÓN + CTA + MINIATURA JSON: ${pkg.contenido.length} pieza(s)`);
}

module.exports = { buildRetention, enrichPackage };
