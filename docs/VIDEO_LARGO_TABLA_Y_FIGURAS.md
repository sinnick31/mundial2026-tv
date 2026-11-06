# Video largo: tabla, resultados y figuras del Campeonato Nacional

El resumen largo prioriza la tabla de posiciones de Primera División de Chile, seguida de resultados recientes, líderes estadísticos disponibles y próximos partidos.

## Fuentes y validación

- Tabla principal: ESPN Soccer standings para `chi.1`.
- Respaldo: TheSportsDB `lookuptable.php?l=4627`, solo si devuelve al menos ocho equipos con puntos.
- Figuras: líderes estadísticos del endpoint ESPN Core Soccer `chi.1/leaders`. Si el proveedor no entrega atletas y valores identificables, no se inventan jugadores ni estadísticas.
- La tabla se bloquea si no hay una clasificación completa. El video largo no se renderiza con una tabla vacía o parcial.
- La fecha que aparece en pantalla indica cuándo se consultó la fuente, no una hora de actualización declarada por el proveedor.

## Imágenes con autorización explícita

Los escudos se leen de `TEAM_IMAGES_JSON`, el mismo catálogo de recursos autorizado usado por el newsroom. Cada entrada debe identificar al equipo y contener:

- `url`: URL HTTPS del recurso.
- `team`: nombre del club al que pertenece.
- `sourceUrl`: página HTTPS de origen.
- `credit`: autor o titular del recurso.
- `rights`: `authorized`.
- `authorizationReference` o `licenseUrl` HTTPS.
- `permittedUse`: debe incluir `youtube` o `youtube_monetized`.

Los retratos se leen de un secreto opcional de GitHub Actions llamado `PLAYER_IMAGES_JSON`. Es un arreglo de objetos con los mismos campos de autorización, más `name` y `team` para asociar inequívocamente la fotografía al futbolista y su club. No se aceptan fotos solo por estar disponibles en una web o API.

Si un escudo o retrato no tiene autorización verificable, la plantilla utiliza iniciales y gráficos originales. No descarga imágenes automáticamente ni confunde un jugador con otro.

## Producción y publicación

El workflow renderiza el video largo en modo local y lo incluye en el artefacto de salida. Este paso fija `PUBLISH_TO_YOUTUBE=false`; no sube el video largo ni cambia permisos OAuth. El paso de video largo es independiente y no bloquea la generación del Short si faltan estadísticas o imágenes.
