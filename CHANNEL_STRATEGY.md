# MUNDIAL2026SHORTS v7

## Objetivo
Recuperar distribución del canal mediante Shorts originales, rápidos y verificables.

## Posicionamiento
- Fútbol chileno como núcleo.
- Colo-Colo como prioridad editorial, sin convertir todo el canal en un solo club.
- Chilenos por el mundo como segunda columna.
- Noticias internacionales solo cuando tengan una conexión fuerte con Chile.
- El nombre del repositorio puede conservarse por continuidad técnica, pero el producto editorial ya no depende del Mundial 2026.

## Regla de publicación
Máximo 1 Short por ejecución automática. Tres ventanas diarias.
La prioridad es publicar una historia fuerte, no llenar el canal.

## Estructura de cada Short
1. Gancho inmediato basado en un hecho confirmado.
2. Hecho principal.
3. Contexto original del canal.
4. Qué significa o qué hay que mirar después.
5. Cierre breve que invite a comentar, sin inventar información.

## Fuentes
La pieza debe conservar:
- URL verificable.
- Nombre de la fuente.
- Fecha/hora.
- Categoría.
- Huella de la historia en content-history.json.

No se publican historias sin fuente.

## Automatización
Fuentes -> scoring -> selección -> guion original -> validación -> Remotion -> YouTube.

Gemini puede ayudar con redacción, pero no decide hechos.

## Lo que se retiró
Se eliminaron del camino activo los scripts heredados de generación/ingesta/upload que duplicaban el pipeline actual. Los módulos de render y composición útiles se conservan.

## Bloqueador actual
La generación funciona. La publicación no funciona porque YouTube devuelve:
HTTP 401 / invalid_client

Esto apunta a una inconsistencia entre YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET y/o el OAuth client que emitió YOUTUBE_REFRESH_TOKEN. No es un problema de Remotion ni de generación editorial.
