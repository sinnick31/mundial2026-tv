# Sistema operativo de prensa deportiva

**Versión:** 1.0 · **Fecha:** 15-10-2026  
**Propósito:** convertir el canal en un medio deportivo reconocible, fiable, sostenible y con una vía clara hacia la monetización.

## 1. La promesa editorial

**Fútbol chileno primero. Fútbol mundial siempre. Datos verificados y contexto que el titular no te entrega.**

El canal no es una cuenta automática de titulares. Cada pieza debe resolver al menos una pregunta para la audiencia: qué pasó, qué está confirmado, por qué importa o qué cambia a continuación.

### Audiencia principal
Personas que siguen el fútbol chileno, quieren estar al día con Colo-Colo y otros clubes, siguen a jugadores chilenos en el extranjero y también consumen fútbol internacional. El tono será de prensa deportiva: directo, enérgico, cercano y riguroso.

### Pilares editoriales
Los porcentajes son objetivos de planificación para una ventana móvil de 14 publicaciones; no son una cuota que justifique publicar noticias débiles.

| Pilar principal | Objetivo | Regla de equilibrio |
|---|---:|---|
| Fútbol chileno: todas las divisiones, copas, femenino y selecciones | 40% | Colo-Colo puede ser prioritario, pero no monopolizar la portada |
| Chilenos en el extranjero | 15% | Confirmar equipo, competición y estado de la noticia |
| Fútbol internacional | 25% | Seleccionar historias relevantes, no perseguir cada titular |
| Análisis, táctica, reglas, historia y datos | 15% | Aportar explicación propia y fuentes |
| Comunidad y servicio al hincha | 5% | Encuestas, agenda, resultados explicados y preguntas útiles |

Dentro del bloque chileno, reservar espacio explícito para clubes distintos de Colo-Colo. Como referencia, no más del 20% de todas las publicaciones debería girar en torno a un solo club durante la ventana de 14 piezas, salvo una noticia extraordinaria. Si falta información fiable, no rellenar la cuota.

## 2. Arquitectura del sistema

1. **Radar de noticias:** feeds y fuentes estructuradas que ya están en el repositorio.
2. **Selección:** puntuación editorial y frescura. El score ayuda a priorizar; no certifica que un hecho sea cierto.
3. **Verificación:** enlace de origen, fecha del artículo, fecha del hecho, atribución y segunda confirmación para noticias sensibles.
4. **Guion original:** hecho confirmado, contexto, implicancia, incertidumbre explícita y pregunta final.
5. **Control editorial:** bloquear rumores presentados como hechos, afirmaciones sin respaldo, duplicados y material audiovisual sin derechos.
6. **Diseño y montaje:** plantilla de identidad televisiva, subtítulos revisados, audio claro, gráficos propios y ritmo que sirva a la historia.
7. **Publicación:** título específico, descripción con fuentes, miniatura para videos largos y revisión del resultado publicado.
8. **Aprendizaje:** registrar métricas a 24 horas y 7 días; cambiar una variable a la vez.
9. **Ingresos:** desarrollar primero una audiencia fiel y un formato largo consistente; preparar patrocinios y afiliación con transparencia, sin depender exclusivamente de anuncios.

**Flujo resumido:** detectar → verificar → seleccionar → explicar → producir → revisar → publicar → medir → mejorar.

## 3. Reglas de publicación

- La exactitud tiene prioridad sobre la velocidad. Si la noticia no pasa verificación, se retiene.
- Cada noticia debe tener URL directa, medio o entidad fuente y fecha.
- Los fichajes, lesiones, sanciones, renuncias y conflictos requieren fuente oficial o corroboración sólida independiente. Una cuenta social desconocida no basta.
- Separar claramente hechos, declaraciones atribuidas, rumores y análisis.
- No inventar exclusivas, cifras, citas, alineaciones, sanciones, resultados, consecuencias ni confirmaciones.
- No presentar una noticia antigua como última hora. Mostrar la fecha correcta cuando sea relevante.
- El guion debe añadir una lectura propia: qué cambia, por qué importa o qué dato falta.
- Nunca leer un artículo completo como si fuera narración propia.
- Si no hay noticia suficientemente útil, la ejecución puede terminar sin publicar. El silencio editorial es mejor que el relleno.
- Toda publicación debe tener revisión final de texto, pronunciación de nombres, subtítulos, audio, imágenes y destino del enlace.

## 4. Cadencia de producción

### Diario
- Mantener las ventanas actuales del pipeline como oportunidades de detección, no como obligación de publicar.
- Objetivo inicial: 1–2 Shorts buenos al día, si pasan la revisión. El tercero se publica solo si ofrece una historia diferente y sólida.
- Responder comentarios útiles y registrar preguntas recurrentes para nuevos videos.
- Revisar el estado real de cada ejecución: generación, render, subida y URL pública. Un workflow verde no reemplaza la inspección de muestra.

### Semanal
- Preparar un video largo original de 6–10 minutos, inicialmente con selección y revisión humana. El flujo actual de Shorts no debe considerarse un sistema de videos largos hasta que exista un job separado probado.
- Hacer un resumen editorial de resultados y próximos partidos, con fecha de corte visible.
- Revisar 3 videos: mejor rendimiento, peor rendimiento y uno representativo. Identificar una lección comprobable.
- Planificar los próximos 7 días según agenda deportiva confirmada y noticias probables, sin inventar temas para cumplir el calendario.

### Tiempo de trabajo sugerido, 60–90 minutos al día
- 15 min: revisar fuentes y agenda.
- 15 min: validar y elegir historias.
- 15–30 min: editar la pieza o revisar el render automático.
- 10 min: responder a la comunidad y registrar métricas.
- 5–10 min: anotar qué probar después.

## 5. Guion estándar para Shorts

**0–2 s: gancho factual.** Equipo o protagonista + hecho concreto; sin saludo ni introducción genérica.

**2–7 s: noticia.** Qué pasó y cuándo, sin rodeos.

**7–18 s: contexto.** Dos o tres hechos comprobables que ayuden a entenderlo.

**18–28 s: valor propio.** Qué significa, qué cambia o qué falta confirmar. Distinguir análisis de hechos.

**Cierre:** una pregunta específica relacionada con la historia.

La duración se adapta a la noticia. Esta estructura es una hipótesis inicial que se prueba con métricas, no una fórmula universal ni una promesa de viralidad.

### Fórmulas de gancho que deben completarse con hechos reales
- “Ojo con [equipo]: esto es lo que sí se confirmó”.
- “La noticia de [torneo] que cambia el panorama por una razón”.
- “¿Qué se sabe de [tema]? Hechos confirmados y lo que todavía falta”.
- “No es solo el resultado: este dato explica lo que pasó”.
- “Atención al fútbol chileno: [hecho concreto], y esto es lo que significa”.

No repetir la misma apertura en piezas consecutivas ni usar “OFICIAL” sin confirmación.

## 6. Identidad visual de sala de prensa

- Sistema fijo de tipografía, colores, jerarquía de datos, placas y subtítulos.
- Marca pequeña y consistente; el protagonista visual y el dato principal deben dominar.
- Miniaturas de videos largos con una idea visual y 2–5 palabras útiles; evitar párrafos, resultados falsos y rostros deformados.
- Shorts en vertical con subtítulos grandes y legibles, cortes al servicio de la información y gráficos originales.
- Utilizar imágenes propias, autorizadas o con licencia comercial compatible. Registrar créditos y límites de uso.
- Evitar depender de presentaciones de diapositivas, plantillas intercambiables o narración genérica. Cada pieza necesita una selección y un ángulo editorial propios.

## 7. Qué significa “listo para publicar”

La pieza solo pasa si la respuesta a todas estas preguntas es sí:

- ¿La afirmación principal está respaldada por una fuente identificable?
- ¿La fecha del hecho y la fecha de publicación están bien distinguidas?
- ¿El gancho coincide exactamente con lo que sabemos?
- ¿El guion aporta contexto o análisis propio?
- ¿Se identifican rumores y dudas como tales?
- ¿Cada imagen, clip, música, logo y audio tiene autorización/licencia compatible con el uso previsto?
- ¿El montaje se entiende sin depender del titular?
- ¿Los subtítulos, nombres y cifras son correctos?
- ¿El título despierta curiosidad sin engañar?
- ¿La descripción conserva las fuentes necesarias?
- ¿Se revisó el archivo final y, después de subir, el enlace público?

Ante una respuesta negativa en veracidad o derechos, **NO PUBLICAR**.

## 8. Tablero de mando

La plantilla editable vive en `templates/seguimiento-publicaciones.csv`; las definiciones y el ciclo de análisis están en `docs/METRICAS_Y_APRENDIZAJE.md`.

Los indicadores principales son:
- Shorts: “vieron frente a deslizaron”, duración media, porcentaje medio visto, suscriptores ganados y comentarios relevantes.
- Videos largos: impresiones, CTR, duración media, horas de reproducción, espectadores recurrentes y suscriptores por video.
- Negocio: ingresos por fuente, consultas comerciales, clics afiliados cuando la plataforma los reporte y costos de producción.
- Calidad: porcentaje de piezas con fuentes, incidencias de derechos, correcciones y fallos de publicación.

No comparar Shorts y videos largos con una única meta ni diagnosticar un patrón con una sola publicación.

## 9. Ruta de monetización

1. **Ahora:** construir confianza, demostrar un estilo editorial reconocible y enlazar videos relacionados.
2. **Primer hito:** revisar la sección Ingresos de YouTube Studio y trabajar el umbral disponible para el canal. Los requisitos varían por función, país y cuenta.
3. **Horas de reproducción:** desarrollar el video largo semanal y series con valor de archivo: previa, análisis de jornada, explicador y balance de fecha.
4. **Patrocinios:** preparar un dossier con audiencia real, temas, formatos, entregables y datos comprobados. No inflar cifras.
5. **Afiliación:** probar productos genuinamente pertinentes para hinchas o creadores, explicar la relación comercial y medir clics/conversiones sin llenar cada video de promociones.
6. **Otras fuentes:** colaboraciones, menciones patrocinadas y productos editoriales propios, siempre respetando políticas de plataforma y reglas aplicables.

No hay garantía de ingresos ni un plazo garantizado para entrar al programa. La originalidad, los derechos y el valor para el espectador forman parte de la estrategia de monetización, no son un trámite al final.

## 10. Gobernanza técnica y seguridad

- No guardar claves OAuth, tokens ni datos personales en el repositorio.
- No exponer ni copiar valores de GitHub Secrets en logs, issues, artefactos o documentos.
- Los cambios al workflow de publicación deben ir en una rama y probarse antes de integrarse.
- Evitar pushes forzados a `main` y cambios simultáneos en archivos de memoria. Mantener un historial recuperable.
- La automatización no puede saltarse la verificación editorial ni publicar una noticia solo por alcanzar un umbral de score.
- La recuperación OAuth debe seguir un procedimiento separado y probado. Nunca pedir ni guardar claves en una conversación pública.

## 11. Ritmo de revisión

- **Diario:** estado de los jobs, pieza publicada y calidad editorial.
- **Cada 7 días:** rendimiento por tema y formato; elegir una mejora.
- **Cada 14 publicaciones:** recalibrar mezcla de pilares, ganchos y duración.
- **Cada 30 días:** revisar crecimiento, audiencia recurrente, monetización, derechos, costos y salud técnica.

## 12. Referencias de política

- [Políticas de monetización de canales](https://support.google.com/youtube/answer/1311392)
- [Elegibilidad del Programa de socios de YouTube](https://support.google.com/youtube/answer/72851)
- [Tipos de contenido que pueden monetizarse](https://support.google.com/youtube/answer/2490020)
- [Analítica de Shorts en YouTube Studio](https://support.google.com/youtube/answer/12942217)

Las políticas pueden cambiar; confirmar la versión vigente en YouTube Studio antes de tomar una decisión comercial.
