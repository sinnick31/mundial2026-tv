# Especificación editorial de FÚTBOL CHILENSIS

## Objetivo

Convertir el pipeline en una sala de prensa deportiva: noticias claras, narración natural, contexto útil y piezas diferenciadas. La automatización no debe inventar datos para completar una historia.

## Fuentes y verificación

- TNT Sports Chile (`https://www.tntsports.cl/`) es la fuente prioritaria de descubrimiento para el fútbol chileno: el rastreador consulta directamente la portada y complementa con feeds RSS de secciones TNT.
- El Instagram oficial de TNT Sports Chile puede utilizarse como señal de descubrimiento, pero la publicación original debe abrirse y contrastarse antes de tratarla como hecho.
- Para resultados y programación, el pipeline utiliza el marcador de ESPN; no consulta football-data.org. Contrastar datos centrales con clubes, ANFP, competiciones y organismos oficiales cuando corresponda.
- Conservar URL, medio, fecha y metadatos de procedencia en el paquete y en la descripción. No leerlos como descargos en la narración.
- Un titular o snippet RSS no equivale a una noticia completa. Si no se recupera el cuerpo de la noticia o una segunda fuente que confirme los detalles centrales, reducir el alcance del guion o bloquearlo; nunca rellenar con inferencias.

## Guiones de Shorts

1. Abrir en los primeros 0-3 segundos con el hecho noticioso, conflicto o consecuencia respaldada por la fuente.
2. Explicar qué ocurrió y quiénes están involucrados con nombres y datos disponibles.
3. Añadir contexto o consecuencia editorial, separado de los hechos confirmados.
4. Cerrar con una pregunta concreta para la comunidad y un CTA breve.
5. Evitar prefijos repetidos, lectura de fechas de publicación, nombres de medios en voz y frases como "la fuente no entrega...".
6. No repetir el titular en el cuerpo ni publicar piezas sustancialmente duplicadas el mismo día.

## Videos largos

- Agrupar por historias: partido destacado, noticia/polémica confirmada, impacto en la tabla cuando exista tabla verificada, y próximos encuentros.
- No limitarse a enumerar marcadores. Explicar la consecuencia deportiva cuando los datos la permitan.
- No inventar goleadores, estadios, posiciones, sanciones ni horarios.
- Si falta un dato secundario, omitirlo naturalmente; no convertir su ausencia en una frase del locutor.
- La duración depende del material disponible. No alargar con relleno.

## Títulos y miniaturas

- Títulos centrados en el hecho principal, diferenciados y de hasta 100 caracteres.
- Evitar prefijos genéricos y fechas en todos los títulos.
- Crear un concepto de miniatura individual por pieza, con un mensaje breve y una composición legible en móvil.
- Usar imágenes y escudos correctos, autorizados y asociados al equipo correcto. No inventar logotipos ni resultados.
- Miniaturas horizontales 16:9 para videos largos y recursos compatibles con las superficies de YouTube para Shorts. Respetar límites y zonas seguras de YouTube.
- El prompt/brief de miniatura no debe confundirse con una imagen final generada y validada.

## Identidad del canal y miniaturas

- Banner de YouTube: SVG maestro de 2560 × 1440 px; nombre y propuesta editorial ubicados dentro del área segura central de 1546 × 423 px.
- Avatar: SVG maestro cuadrado de 800 × 800 px, con símbolo FC legible en recorte circular.
- Shorts: miniatura individual vertical 1080 × 1920 px generada junto a cada render.
- Videos largos: miniatura individual horizontal 1280 × 720 px, con titular principal y equipos solo cuando están identificados.
- Los escudos/fotografías de clubes solo se incorporan desde el catálogo de recursos autorizados y asociados al equipo correcto. Si no hay recurso autorizado, se usa identidad tipográfica, no un escudo inventado.
- Los SVG son archivos maestros; antes de subirlos como arte del canal deben exportarse a PNG o JPEG, formatos admitidos por YouTube.

## Calidad y publicación

- Validar claridad, integridad, repeticiones, nombres, resultados, URLs y derechos de uso antes de renderizar.
- Bloquear una pieza cuando la fuente no sustente el dato principal o cuando falten recursos visuales esenciales.
- Medir retención inicial, duración media, comentarios y suscriptores; usar esos datos para mejorar el siguiente guion.
- Las modificaciones de esta rama se validan sin subir videos. La publicación requiere una autorización separada y explícita.

## Límite conocido de la integración

El rastreador intenta resolver cada enlace y extraer el cuerpo desde `articleBody` de schema.org o desde párrafos HTML. Solo marca una noticia como completa cuando recupera al menos 300 caracteres de cuerpo; el generador y el gate editorial rechazan los titulares RSS sin artículo. Algunos artículos pueden seguir inaccesibles por contenido dinámico, bloqueos del sitio o cambios de estructura. En esos casos el pipeline debe omitir la pieza, nunca completar datos por inferencia. La corroboración externa adicional sigue dependiendo de las fuentes oficiales disponibles para cada hecho.
