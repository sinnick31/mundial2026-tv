# Shorts de noticias múltiples · FÚTBOL CHILENSIS

## Objetivo
Composición vertical 9:16 que agrupa varias noticias verificadas en un solo Short. La plantilla Remotion se registra como `NoticiasMultiples` en `src/Root.tsx` y recibe bloques independientes mediante `items[]`.

## Estructura visual
- Apertura inmediata: titular de la primera noticia desde el primer fotograma, sin intro separada.
- Un bloque visual por noticia: titular, imagen autorizada opcional, resumen/subtítulo, equipo o protagonista, fuente y fecha.
- Texto de alto contraste, blanco con sombra oscura, palabras clave en cian de marca.
- Marcador opcional solo cuando el resultado y ambos equipos estén verificados.
- Barra de progreso global y contador de noticia.
- Cierre de identidad FÚTBOL CHILENSIS en la franja inferior.

## Datos por noticia
Cada elemento de `items[]` incluye `title`, `subtitle`, `body`, `source`, `sourceDate` y `frames`. `imageUrl` solo debe incluirse tras validar autorización para YouTube, crédito, origen HTTPS, evidencia de permiso/licencia y correspondencia inequívoca con el jugador o club. Sin imagen autorizada, se muestra un fondo gráfico original. No se inventan escudos ni se reutilizan fotografías del canal de referencia.

## Política editorial
- TNT Sports Chile es la fuente preferente; ESPN es la segunda. Otras fuentes verificables pueden corroborar.
- Verificar nombres, clubes, resultados, competición y fecha antes de renderizar.
- La fecha de publicación de la noticia no debe confundirse con la fecha del partido.
- El texto es una narración original; no copiar titulares extensos ni artículos.
- No reutilizar noticias cubiertas en el Short del mismo día o en el video largo. Compartir `content-history.json` para deduplicación.
- Mantener separadas las noticias rápidas (Shorts) del resumen largo con tabla, resultados, figuras y agenda.

## Duración y ritmo
Objetivo editorial: 20–25 segundos por compilación, con 4–6 bloques muy breves solo cuando cada hecho pueda explicarse con claridad. Si no hay suficientes noticias verificadas, se publica/renderiza menos contenido; nunca se rellena con datos no confirmados.
