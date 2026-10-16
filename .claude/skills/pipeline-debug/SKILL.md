---
name: pipeline-debug
description: Diagnostica fallos de los workflows de GitHub Actions del canal (futbol-pipeline, resultados-largos-diarios, ci) y propone correcciones mínimas.
---

# Diagnóstico de workflows

Workflows en `.github/workflows/`:

- `futbol-pipeline.yml`: 3 ejecuciones diarias (cron UTC 15:00, 19:00, 23:00). Jobs: `generate` → `publish` → `report`.
- `resultados-largos-diarios.yml`: resumen largo 16:9 (cron 15:30 UTC) y validación en cada push.
- `ci.yml`: sintaxis y test de política de publicación en PR y push.

## Método

1. Identificar el job y el paso que falló (con `gh run list` / `gh run view --log-failed` si hay acceso; si no, pedir el log al usuario).
2. Comparar con las causas conocidas:
   - **`tsc` reporta cientos de errores en `node_modules/@types`**: `tsconfig.json` o `eslint.config.js` corruptos (saltos de línea escapados). Validar con `node -e "JSON.parse(...)"`.
   - **"main avanzó durante esta ejecución"**: el paso de memoria editorial falla a propósito para no sobrescribir `content-history.json`. Reconciliar y volver a ejecutar; no forzar el push.
   - **"Run this publishing workflow from main only"**: el workflow se lanzó desde otra rama.
   - **"Scheduled public upload blocked"**: se pidió `public` en una ejecución programada sin `ALLOW_SCHEDULED_PUBLIC=true`. Es el comportamiento esperado.
   - **Fallo en `Validar YouTube OAuth`**: revisar secretos `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` y que el canal coincida con `YOUTUBE_CHANNEL_ID`.
   - **`hay_contenido=false`**: no es un error; no hubo historias con valor suficiente.
3. Proponer el cambio mínimo y ejecutar la skill `preflight-check` antes de subirlo.

## Reglas

- Nunca imprimir ni pegar secretos, tokens o claves en logs, commits o respuestas.
- No debilitar el bloqueo editorial ni la política de visibilidad para "hacer pasar" un workflow.
- Los horarios cron están en UTC; la equivalencia en Chile cambia con el horario de verano.
