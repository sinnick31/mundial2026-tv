# Mundial2026 TV

Fábrica de Shorts verticales para resultados, noticias y análisis del Mundial FIFA 2026.

El proyecto usa Remotion, datos de partidos, generación de guiones con IA, narración, b-roll, metadata SEO y subida automática a YouTube Shorts.

## Estilo visual 2026

- Formato vertical 9:16 en 1080x1920.
- Videos cortos de ritmo rápido para Shorts, TikTok y Reels.
- Estética de estudio deportivo animado con pantallas LED, luces de transmisión, marcador gigante y comentaristas de marca.
- Personajes del canal:
  - Krono: conductor principal.
  - Issy: analista energético.
  - Kuky: experto táctico.
- Descripciones enfocadas en resultados finales cuando el partido ya terminó, no en predicciones.

## Nombre sugerido del video

`Brasil 1-2 Noruega: resultado final con análisis 3D`

Puedes cambiar equipos y marcador según el partido real.

## Descripción base para resultados finales

```text
⚽ RESULTADO FINAL ⚽

Estos fueron los resultados del encuentro. Revive el marcador definitivo, las claves del partido y los momentos más importantes en este resumen con animación 3D cinematográfica.

💬 ¿Qué te pareció el partido?
👇 Déjame tu opinión en los comentarios y cuéntame si esperabas este resultado.

🔔 Suscríbete para no perderte todos los resultados, resúmenes y noticias del Mundial FIFA 2026.

#Mundial2026 #FIFAWorldCup #Resultados #Futbol #Football #Shorts #Resumen #Goles #FIFA #WorldCup2026
```

El repo ahora genera una versión dinámica de esta descripción desde `scripts/metadata-generator.js`.

## Links de afiliados

1. Copia `config/affiliate-links.example.json` como `config/affiliate-links.json`.
2. Reemplaza cada URL por tus links reales.
3. Deja `"enabled": true` solo en los links que quieras publicar.

`config/affiliate-links.json` está ignorado por Git para no publicar links privados o de campaña por accidente.

También puedes usar una ruta externa con:

```bash
AFFILIATE_LINKS_FILE=/ruta/a/mis-links.json npm run ...
```

## Scripts útiles

```bash
npm install
npm run dev
npm run lint
node scripts/fetch-matches.js
node scripts/generate-daily-content.js
node scripts/render-and-upload.js
```

## Flujo automático recomendado

1. Obtener resultados reales del Mundial.
2. Generar contenido diario con `generate-daily-content.js`.
3. Crear narración y video con `render-and-upload.js`.
4. Subir a YouTube Shorts con título, descripción, hashtags y afiliados.
5. Reutilizar el mismo MP4 en TikTok e Instagram Reels.

## Estrategia para crecer hacia 3 millones de visitas

- Publicar primero resultados finales reales: el algoritmo favorece intención clara de búsqueda.
- Subir rápido después del pitazo final.
- Crear 3 ángulos por partido: resultado final, jugada clave y dato táctico.
- Mantener una identidad visual reconocible con Krono, Issy y Kuky.
- Evitar clickbait genérico: usar marcador, minuto, equipo o dato verificable.
- Probar miniaturas con marcador grande, banderas y una emoción clara.
- Revisar retención en los primeros 2 segundos y reescribir ganchos con baja retención.

No se pueden garantizar 3 millones de visitas, pero el repo queda preparado para producir contenido constante, reconocible y optimizado para aumentar la probabilidad de alcance.
