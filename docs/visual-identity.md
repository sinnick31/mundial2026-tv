# Identidad visual y producción gráfica: MUNDIAL 2026

## Posicionamiento
Medio digital de fútbol con estética de televisión deportiva: prioridad editorial para Colo-Colo y todos los torneos del fútbol chileno, sin dejar fuera el fútbol internacional y los chilenos en el exterior.

## Sistema visual
- Base: azul marino `#081F44`, azul eléctrico `#00A3FF`, rojo `#FF0033`, blanco `#FFFFFF` y gris carbón `#1A1A1A`.
- Amarillo `#FFD400` solo para resaltar una palabra clave o un dato.
- Titulares condensados y fuertes; texto auxiliar legible en móvil.
- Composición de miniatura 16:9, un mensaje principal, máximo dos líneas y contraste alto.
- Identificador persistente “MUNDIAL 2026” pequeño y consistente.
- Nunca simular una foto periodística ni inventar escudos, resultados, declaraciones o fichajes.

## Activos del canal
- Perfil: emblema simple de balón/escudo, legible en recorte circular. Exportar PNG cuadrado de 800x800.
- Banner: 2560x1440; mantener logo y texto importante dentro de la zona central segura de YouTube. Evitar información importante en los extremos.
- Miniatura: PNG 1280x720. El pipeline genera un diseño gráfico inicial automáticamente a partir del gancho y la sección editorial.
- Los archivos gráficos generados automáticamente son una base consistente; antes de añadir fotografías de jugadores o partidos, confirmar licencia/permiso y conservar el crédito.

## Integración con el pipeline
1. `config/visual-brand.json` es la fuente única de paleta, secciones y reglas visuales.
2. `scripts/generate-thumbnail.js` produce una miniatura PNG 1280x720 por pieza en `out/<fecha>/`.
3. La subida del video ocurre primero; después el pipeline intenta asignar la miniatura mediante YouTube Data API.
4. Si la miniatura falla, se registra el error y se conserva el video publicado; el reporte distingue el estado de miniatura del estado del video.
5. La publicación automática debe respetar la validación editorial existente y no publicar una noticia sin fuente verificable.

## Evolución recomendada
- Fase 1: aplicar la identidad y generar PNG con fondo gráfico original.
- Fase 2: añadir un catálogo de fotos autorizadas por equipo/competición, con URL, titular de derechos, crédito y permiso de uso.
- Fase 3: revisar CTR de miniaturas y retención por tema cada 7 días; experimentar con una variable por vez.
- Fase 4: exportar perfil y banner finales y cargarlos manualmente en YouTube Studio. No cambiar las imágenes del canal mediante API no disponible en el pipeline actual.

## Criterios de aceptación
- Miniatura PNG de 1280x720, legible en móvil, texto escapado y sin datos inventados.
- No se usa fotografía externa sin autorización registrada.
- Los errores de miniatura no ocultan errores de publicación ni provocan falsos positivos en el reporte.
- Los secretos de YouTube nunca se escriben en archivos del repositorio.
