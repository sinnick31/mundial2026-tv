---
name: editorial-gate
description: Revisa guiones, títulos y piezas de contenido (daily-content.json, content-history.json) contra el control de calidad editorial del canal antes de publicar o cambiar los prompts de generación.
---

# Control editorial de una pieza

Base normativa: `docs/CONTROL_CALIDAD_EDITORIAL.md` y `CHANNEL_STRATEGY.md`. Léelos antes de dictaminar.

## Qué revisar en cada pieza

1. **Fuente**: existe `_fuente` y `_fuente_url` (http/https) y la fuente respalda el hecho central, no solo lo menciona.
2. **Estado de la información**: confirmado, declaración atribuida, reportado por fuente, rumor o análisis. Un rumor nunca se presenta como hecho.
3. **Palabras de alto riesgo**: "oficial", "confirmado", "última hora", "exclusiva" solo con evidencia directa.
4. **Temas sensibles** (fichajes, lesiones, sanciones, acusaciones, investigaciones, cifras): exigir comunicado original o segunda fuente.
5. **Originalidad**: la narración (mínimo 180 caracteres según el pipeline) aporta contexto propio y no repite el titular.
6. **Título y miniatura**: prometen solo lo que el video demuestra. Evitar títulos truncados con "…" o plantillas repetidas.
7. **Derechos**: imágenes, clips y música con permiso comprobado; el crédito no reemplaza al permiso.

## Resultado

Entregar una tabla corta con una fila por pieza: título, veredicto (aprobar / retener / corregir), motivo en una frase. Ante duda sobre un hecho, el veredicto es **retener**: es mejor no publicar que publicar relleno.

## Señales a vigilar en este repo

- Mezcla editorial: la estrategia pide ~55 % fútbol chileno, ~15 % chilenos en el exterior y ~30 % internacional, sin concentrarse en un solo club. Si el historial muestra una concentración alta en un club, avisarlo.
- Etiquetas de categoría coherentes: una noticia de fútbol chileno no debería llevar la etiqueta "FÚTBOL MUNDIAL".
- Piezas tipo "ANÁLISIS SIN DATOS DIRECTOS" o "falta de datos" indican predicciones sin datos suficientes: proponer descartarlas.
