# MUNDIAL2026SHORTS — estrategia editorial viva

## Objetivo

Construir un medio digital de fútbol en español chileno, con identidad de prensa deportiva profesional, cobertura verificable y una ventaja editorial: contar el fútbol chileno de todos los equipos sin dejar de cubrir el mundo.

## Posicionamiento y promesa

**Promesa:** “Qué pasó, qué está confirmado y por qué importa”.

- **Fútbol chileno:** núcleo editorial, con Liga de Primera, Ascenso, Segunda División, Copa Chile, copas nacionales, fútbol femenino, selecciones, formativo y regional cuando haya fuentes fiables.
- **Colo-Colo:** prioridad editorial cuando existan noticias relevantes y confirmadas, sin hacer que todo el canal sea un canal de un solo club.
- **Chilenos por el mundo:** seguimiento de jugadores y entrenadores en otras ligas.
- **Fútbol internacional:** cobertura propia de las grandes noticias de clubes, competiciones y selecciones aunque no tengan conexión directa con Chile.
- **Fútbol femenino y otras categorías:** presencia constante cuando haya material verificado; no relegarlas únicamente a efemérides.

Mezcla semanal orientativa: 55 % fútbol chileno, 15 % chilenos en el extranjero/selecciones y 30 % fútbol internacional. Dentro del bloque chileno, dar prioridad a Colo-Colo cuando el hecho tenga valor y mantener espacio para otros clubes y categorías. Son rangos de planificación, no cuotas que obliguen a publicar una historia débil.

## Regla editorial

La noticia más fuerte verificada tiene prioridad sobre el calendario. El sistema puede ejecutar tres ventanas al día, pero cada ventana no obliga a publicar. Mejor saltarse una publicación que fabricar actualidad.

Cada vídeo debe tener:
1. Un hecho concreto y verificable en la apertura.
2. Una fuente directa que respalde el hecho y una atribución clara.
3. Contexto original que no repita el titular.
4. Un ángulo propio, relevante para la audiencia.
5. Un cierre natural con pregunta específica o qué observar después.

No inventar exclusivas, declaraciones, lesiones, fichajes, cifras, sanciones ni consecuencias. No usar “oficial”, “confirmado” o “última hora” sin evidencia suficiente. No existe una fórmula que garantice viralidad o que fuerce la recomendación de YouTube.

## Automatización y calendario

Fuente → normalización → deduplicación → puntuación → guion original → controles editoriales → render → publicación → comprobación → medición.

El pipeline activo está en el archivo .github/workflows/futbol-pipeline.yml. Sus cron actuales son 15:00, 19:00 y 23:00 UTC, equivalentes a 12:00, 16:00 y 20:00 en Chile durante horario UTC−3. La zona horaria estacional puede cambiar la equivalencia local; verificar el cron y esta documentación tras cada cambio.

La generación con IA no decide qué es verdad. El canal mantiene responsabilidad humana sobre los hechos, las imágenes y derechos, el guion y las correcciones. Mientras no se haya auditado una muestra sostenida de publicaciones, revisar manualmente el producto final; pausar publicaciones automáticas ante una alerta editorial o de derechos.

## Medición

- Shorts: porcentaje que se queda frente a deslizar, retención inicial, duración media, porcentaje visto y suscriptores ganados.
- Vídeos largos: CTR de impresiones, duración media, retención por sección y espectadores recurrentes.
- Todas las piezas: correcciones, reclamaciones, fuente verificable, autorización de visuales y URL pública.

Revisar el rendimiento a las 24 horas y a los 7 días; comparar formatos similares y cambiar una variable a la vez. No tomar una decisión con muestras pequeñas.

## Estándar de monetización

Prioridad 1: producir contenido original que cumpla las políticas de YouTube.  
Prioridad 2: desarrollar audiencia recurrente y formatos diferenciados.  
Prioridad 3: preparar patrocinios transparentes y afiliación externa solo si son relevantes y cumplen sus condiciones.  
Prioridad 4: solicitar funciones YPP cuando YouTube Studio confirme elegibilidad.

La autorización de copyright, la originalidad para monetización y la calidad periodística son controles diferentes. El crédito no sustituye al permiso. No publicar goles o imágenes de transmisión sin licencia o autorización comprobada.

## Documentos operativos

- [Sistema operativo editorial](docs/SISTEMA_OPERATIVO_PRENSA_FUTBOL.md)
- [Monetización y patrocinios](docs/MONETIZACION_Y_PATROCINIOS.md)
- [Control de calidad editorial](docs/CONTROL_CALIDAD_EDITORIAL.md)
- [Plan de implementación de 30 días](docs/PLAN_30_DIAS.md)
- [Gestión de imágenes autorizadas](docs/IMAGENES_EQUIPOS.md)

## Diagnóstico técnico

El historial de GitHub Actions es la fuente de verdad para el estado del pipeline. No usar diagnósticos antiguos como el error OAuth invalid_client sin volver a comprobar una ejecución reciente. Un workflow “success” certifica solo que los controles técnicos configurados pasaron; no prueba por sí solo que la historia sea correcta ni que la publicación tenga un buen rendimiento.
