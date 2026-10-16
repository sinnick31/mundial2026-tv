---
name: weekly-channel-report
description: Prepara el reporte semanal del canal a partir de content-history.json y de los datos exportados de YouTube Studio, usando docs/PLANTILLA_REPORTE_SEMANAL.md.
---

# Reporte semanal del canal

## Entradas

- `content-history.json` (campo `items`: `fecha`, `tipo_contenido`, `titulo`, `hook`). Ojo: registra piezas generadas, no necesariamente públicas; el pipeline sube por defecto como `unlisted`.
- Exportación de YouTube Studio (Analytics → Avanzado → Exportar, CSV) con impresiones, CTR, retención, duración media y suscriptores por video. Si el usuario no la entrega, dejar esas columnas como "sin dato" y no estimarlas.
- Plantilla: `docs/PLANTILLA_REPORTE_SEMANAL.md`.

## Pasos

1. Fijar la semana (lunes a domingo) y filtrar `items` por `fecha`.
2. Contar piezas por `tipo_contenido`, por día y por tema (Colo-Colo, otros clubes chilenos, chilenos en el exterior, internacional).
3. Cruzar con el CSV de Studio por título o fecha. Comparar solo formatos parecidos (Shorts con Shorts, largos con largos).
4. Rellenar la plantilla: qué funcionó, qué no, el riesgo de calidad más importante y **una sola** prioridad para la semana siguiente.
5. Marcar muestras pequeñas como no concluyentes; cambiar una variable a la vez.

## Reglas

- No inventar métricas ni atribuir resultados a un cambio sin evidencia.
- Registrar la fecha de corte de los datos.
- Guardar el reporte como `docs/reportes/AAAA-MM-DD.md` solo si el usuario lo pide.
