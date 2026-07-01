# Broll real para los videos (sin copyright)

Estos clips se usan como fondo/atmósfera detrás de los gráficos en
`PrediccionShorts` y `JugadaAnimada`. Son **video real de fútbol**,
con licencia Pexels (gratis, uso comercial permitido, sin atribución
obligatoria) — cero riesgo de Content ID.

## Cómo agregarlos (una sola vez)

1. Descarga 5-8 clips de esta lista (botón "Free Download", elige
   calidad HD o 4K, formato MP4):

   - https://www.pexels.com/video/aerial-footage-of-a-soccer-field-8938615/
   - https://www.pexels.com/video/people-playing-soccer-6077718/
   - https://www.pexels.com/video/aerial-view-of-soccer-game-on-green-field-28870860/
   - https://www.pexels.com/video/top-view-footage-of-the-soccer-field-3441747/
   - https://www.pexels.com/video/football-players-kicking-the-ball-during-a-match-15448993/
   - https://www.pexels.com/video/soccer-game-in-a-stadium-2657257/
   - https://www.pexels.com/video/football-players-running-on-a-field-14507176/

2. Conviértelos a vertical 1080x1920, ~8s, sin audio (más liviano y
   listo para usarse de fondo). Necesitas `ffmpeg` instalado:

   ```bash
   ffmpeg -i original.mp4 -t 8 -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -an -c:v libx264 -crf 23 public/broll/clip1.mp4
   ```

   Repite para cada clip (`clip2.mp4`, `clip3.mp4`, ...).

3. Commitea los archivos resultantes dentro de `public/broll/`.
   El pipeline (`render-and-upload.js`) elige uno al azar en cada video.

## Por qué esto es seguro

Pexels License permite uso comercial, modificación y redistribución
dentro de un proyecto derivado (como estos Shorts) sin pedir permiso
ni dar crédito: https://www.pexels.com/license/

Esto es distinto a usar clips de transmisiones oficiales del Mundial
(FIFA+, ESPN, etc.), que SÍ tienen copyright y dan strike.

## Tamaño del repo

Cada clip de 8s a 1080x1920 pesa ~3-6 MB ya comprimido. Con 6-8 clips
el repo crece ~30-40 MB — aceptable. Si quieres mantenerlo liviano,
usa menos clips o bájales más la calidad (`-crf 28`).
