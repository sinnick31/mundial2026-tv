# Especificación editorial de FÚTBOL CHILENSIS

## Objetivo

Convertir el pipeline en una sala de prensa deportiva: noticias claras, narración natural, contexto útil y piezas diferenciadas. La automatización no debe inventar datos para completar una historia.

## Fuentes y verificación

- TNT Sports Chile (`https://www.tntsports.cl/`) es la fuente prioritaria de descubrimiento para el fútbol chileno.
- El Instagram oficial de TNT Sports Chile puede utilizarse como señal de descubrimiento, pero la publicación original debe abrirse y contrastarse antes de tratarla como hecho.
- Contrastar datos centrales con clubes, ANFP, competiciones y organismos oficiales cuando corresponda.
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

## Calidad y publicación

- Validar claridad, integridad, repeticiones, nombres, resultados, URLs y derechos de uso antes de renderizar.
- Bloquear una pieza cuando la fuente no sustente el dato principal o cuando falten recursos visuales esenciales.
- Medir retención inicial, duración media, comentarios y suscriptores; usar esos datos para mejorar el siguiente guion.
- Las modificaciones de esta rama se validan sin subir videos. La publicación requiere una autorización separada y explícita.

## Límite conocido de la integración

La ingesta TNT actual descubre artículos mediante Google News RSS. El RSS puede entregar solo un titular y un extracto. Esta integración mejora la redacción y el empaquetado, pero no afirma que todos los artículos completos estén siendo recuperados automáticamente. La recuperación del cuerpo de cada artículo y la verificación cruzada deben implementarse como una etapa separada antes de exigir guiones con todos los detalles.
