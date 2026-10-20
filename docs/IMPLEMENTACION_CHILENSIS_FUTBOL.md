# Implementación — Chilensis Fútbol

Este plan adapta el repositorio existente `sinnick31/mundial2026-tv`. No crear un repositorio paralelo ni borrar la memoria editorial. El nombre público del canal es **Chilensis Fútbol**; los nombres internos históricos se migran gradualmente para no romper workflows.

## Fase 1 — Base segura

1. Mantener `.github/workflows/futbol-pipeline.yml` como pipeline activo hasta completar pruebas.
2. Mantener la ingesta de fuentes, la deduplicación, el bloqueo editorial y la reconciliación de `content-history.json` y `news-cache.json`.
3. Confirmar que la ejecución manual produce primero un vídeo no listado/privado para revisión; no habilitar publicación pública programada por defecto.
4. Revisar los logs más recientes de Actions antes de cambiar OAuth. No asumir que un error histórico sigue vigente.
5. No guardar tokens en código ni en archivos de configuración versionados.

## Fase 2 — Identidad visual

1. Usar la guía `docs/IDENTIDAD_VISUAL_CHILENSIS_FUTBOL.md`.
2. Crear o adaptar logo tipográfico original, banner, avatar y miniaturas SVG editables.
3. Mantener una paleta y jerarquía tipográfica común, con variaciones por formato.
4. Evitar escudos como marca del canal y cualquier recurso de transmisión sin permiso.
5. Probar miniaturas a tamaño móvil y comprobar legibilidad antes de publicar.

## Fase 3 — Criterio editorial

Cada historia debe indicar:
- qué ocurrió;
- qué está confirmado y qué sigue sin confirmación;
- fuente directa, fecha del hecho y fecha de consulta;
- contexto original y por qué importa;
- derechos del material visual.

La prioridad es: fútbol chileno completo, Colo-Colo cuando haya información relevante, chilenos en el extranjero y fútbol internacional. Incluir fútbol femenino y categorías inferiores cuando haya fuentes fiables. Nunca rellenar una ventana de publicación con una noticia débil.

## Fase 4 — Automatización gradual

Orden recomendado:
1. Probar ingesta, normalización y deduplicación.
2. Probar el bloqueo editorial con noticias válidas y casos inválidos.
3. Renderizar un Short de prueba con gráficos propios.
4. Validar duración, audio, subtítulos, relación de aspecto y archivo final.
5. Ejecutar el preflight de YouTube OAuth sin publicar.
6. Publicar como no listado y revisar manualmente el resultado.
7. Activar publicación pública solo después de que todas las puertas anteriores pasen de forma repetida.

Si una etapa falla, guardar diagnóstico y detener esa pieza. No omitir validaciones para forzar una publicación.

## Fase 5 — Rutina editorial inicial

Ritmo objetivo, no obligación:
- 1 Short con la noticia verificada más relevante.
- 1 segunda pieza solo si hay otro hecho suficientemente importante y distinto.
- 1 resumen largo de resultados únicamente cuando los marcadores y fechas estén comprobados y haya suficiente contenido.

La frecuencia se ajustará a calidad y capacidad técnica. No prometer viralidad ni publicar por cumplir cuotas.

## Fase 6 — Revisión semanal

Revisar:
- rendimiento a 24 horas y 7 días;
- porcentaje de personas que se quedan en Shorts;
- retención inicial y duración media;
- clics y retención de vídeos largos;
- correcciones, reclamaciones y fallos del pipeline;
- temas y formatos que generan conversación real.

Cambiar una variable cada vez y documentar el aprendizaje. No sacar conclusiones fuertes de una muestra pequeña.

## Criterio de salida

La implementación se considera estable cuando se puede rastrear la fuente de cada noticia, los recursos visuales están autorizados, las pruebas pasan, la publicación se confirma y los fallos detienen el flujo con un registro claro.
