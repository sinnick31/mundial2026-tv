# CHILENSIS FÚTBOL — estrategia editorial viva

> Identidad pública: **Chilensis Fútbol**. El repositorio conserva el nombre histórico `mundial2026-tv` para no romper integraciones existentes.

## Objetivo

Construir un medio digital de fútbol en español chileno, con identidad de prensa deportiva profesional, cobertura verificable y una ventaja editorial: contar el fútbol chileno de todos los equipos sin dejar de cubrir el mundo.

## Posicionamiento y promesa

**Promesa:** “Qué pasó, qué está confirmado y por qué importa”.

La dirección creativa combina tres referencias funcionales, sin copiar sus activos protegidos:
- **Televisión deportiva:** jerarquía visual, marcadores legibles, consistencia gráfica y ritmo de noticiero.
- **Noticias rápidas:** titular concreto, atribución de fuentes, actualización y distinción clara entre confirmado y rumor.
- **Análisis deportivo:** contexto, debate argumentado y explicación de por qué importa una noticia.

- **Fútbol chileno:** núcleo editorial, con Liga de Primera, Ascenso, Segunda División, Copa Chile, copas nacionales, fútbol femenino, selecciones, formativo y regional cuando haya fuentes fiables.
- **Colo-Colo:** prioridad editorial cuando existan noticias relevantes y confirmadas, sin que el canal se convierta en un canal de un solo club.
- **Chilenos por el mundo:** seguimiento de jugadores y entrenadores en otras ligas.
- **Fútbol internacional:** cobertura propia de las grandes noticias de clubes, competiciones y selecciones aunque no tengan conexión directa con Chile.
- **Fútbol femenino y otras categorías:** presencia constante cuando haya material verificado; no relegarlas únicamente a efemérides.

Mezcla semanal orientativa: 55 % fútbol chileno, 15 % chilenos en el extranjero/selecciones y 30 % fútbol internacional. Dentro del bloque chileno, dar prioridad a Colo-Colo cuando el hecho tenga valor y mantener espacio para otros clubes y categorías. Son rangos de planificación, no cuotas que obliguen a publicar una historia débil.

## Identidad visual

La guía de referencia está en [Identidad visual y sistema editorial](docs/IDENTIDAD_VISUAL_CHILENSIS_FUTBOL.md). La implementación por fases está en [Implementación Chilensis Fútbol](docs/IMPLEMENTACION_CHILENSIS_FUTBOL.md).

Paleta base: azul noche `#101827`, rojo cancha `#E63946`, blanco `#F8FAFC` y gris `#CBD5E1`. Usar tipografía sans-serif legible, títulos breves, contraste alto y gráficos originales. No copiar logos, plantillas exactas, voces ni recursos de transmisión de otros medios.

## Regla editorial

La noticia más fuerte verificada tiene prioridad sobre el calendario. El sistema puede ejecutar tres ventanas al día, pero cada ventana no obliga a publicar. Mejor saltarse una publicación que fabricar actualidad.

Cada vídeo debe tener:
1. Un hecho concreto y verificable en la apertura.
2. Una fuente directa que respalde el hecho y una atribución clara.
3. Contexto original que no repita el titular.
4. Un ángulo propio, relevante para la audiencia.
5. Un cierre natural con pregunta específica o qué observar después.

No inventar exclusivas, declaraciones, lesiones, fichajes, cifras, sanciones ni consecuencias. No usar “oficial”, “confirmado” o “última hora” sin evidencia suficiente. Distinguir la fecha del hecho de la fecha de publicación. La IA puede ayudar a redactar, pero no sustituye la verificación.

## Automatización y calendario

Fuente → normalización → deduplicación → puntuación → revisión factual → guion original → control de derechos → render → revisión final → publicación → comprobación → medición.

El pipeline activo está en `.github/workflows/futbol-pipeline.yml`. Sus cron configurados son 15:00, 19:00 y 23:00 UTC, equivalentes a 12:00, 16:00 y 20:00 en Chile durante horario UTC−3. Verificar el horario local tras cambios estacionales.

La generación con IA no decide qué es verdad. El canal mantiene responsabilidad editorial sobre los hechos, las imágenes y derechos, el guion y las correcciones. Mientras no se haya auditado una muestra sostenida de publicaciones, revisar manualmente el producto final; pausar publicaciones automáticas ante una alerta editorial o de derechos. No activar publicación pública programada por defecto sin validación de todo el flujo.

## Derechos y originalidad

No publicar goles, transmisiones, fotografías ni clips sin licencia o autorización documentada. El crédito no sustituye al permiso. Preferir narración propia, análisis original, gráficos y visuales propios o con licencia compatible. Evitar guiones masivos casi idénticos: cada pieza debe aportar un contexto o punto de vista específico. Estas reglas también ayudan a cumplir los criterios de originalidad de YouTube, pero no garantizan monetización. [Políticas de monetización de YouTube](https://support.google.com/youtube/answer/1311392?hl=es).

## Medición

- Shorts: porcentaje que se queda frente a deslizar, retención inicial, duración media, porcentaje visto y suscriptores ganados.
- Vídeos largos: CTR de impresiones, duración media, retención por sección y espectadores recurrentes.
- Todas las piezas: correcciones, reclamaciones, fuente verificable, autorización de visuales, estado de render y URL pública.

Revisar el rendimiento a las 24 horas y a los 7 días; comparar formatos similares y cambiar una variable a la vez. No tomar una decisión con muestras pequeñas ni prometer viralidad.

## Estándar de monetización

Prioridad 1: producir contenido original que cumpla las políticas de YouTube.  
Prioridad 2: desarrollar audiencia recurrente y formatos diferenciados.  
Prioridad 3: preparar patrocinios transparentes y afiliación externa solo si son relevantes y cumplen sus condiciones.  
Prioridad 4: solicitar funciones YPP cuando YouTube Studio confirme elegibilidad.

La autorización de copyright, la originalidad para monetización y la calidad periodística son controles diferentes.

## Documentos operativos

- [Sistema operativo editorial](docs/SISTEMA_OPERATIVO_PRENSA_FUTBOL.md)
- [Identidad visual Chilensis Fútbol](docs/IDENTIDAD_VISUAL_CHILENSIS_FUTBOL.md)
- [Implementación Chilensis Fútbol](docs/IMPLEMENTACION_CHILENSIS_FUTBOL.md)
- [Monetización y patrocinios](docs/MONETIZACION_Y_PATROCINIOS.md)
- [Control de calidad editorial](docs/CONTROL_CALIDAD_EDITORIAL.md)
- [Plan de implementación de 30 días](docs/PLAN_30_DIAS.md)
- [Gestión de imágenes autorizadas](docs/IMAGENES_EQUIPOS.md)

## Diagnóstico técnico

El historial de GitHub Actions es la fuente de verdad para el estado del pipeline. No usar diagnósticos antiguos como el error OAuth `invalid_client` sin comprobar una ejecución reciente. Un workflow “success” certifica solo que los controles técnicos configurados pasaron; no prueba por sí solo que la historia sea correcta ni que la publicación tenga buen rendimiento.
