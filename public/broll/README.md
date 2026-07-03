# B-roll real de fútbol (automático, sin copyright)

Estos clips son el **fondo de video real** detrás de los gráficos en
`PrediccionShorts` y `JugadaAnimada`. Reemplazan el antiguo fondo negro
que YouTube penalizaba por "parecer bot".

## Ya no hay que hacer nada a mano

El pipeline descarga los clips solo, en cada corrida, con
`scripts/fetch-broll.js` (paso "Descargar b-roll real" del workflow):

- **Con `PEXELS_API_KEY`** (secret opcional): busca clips frescos vía la
  API de Pexels → variedad casi infinita, fondo distinto cada día.
- **Sin API key**: descarga una lista curada de Pexels (licencia libre,
  uso comercial, sin atribución). Funciona igual, con menos variedad.

Los clips se procesan con ffmpeg a 1080x1920, 8s, sin audio, y se
repiten en loop para cubrir videos de 30s+ sin cortes a negro.

## Recomendado: agrega el secret PEXELS_API_KEY

1. Crea una cuenta gratis en https://www.pexels.com/api/
2. Copia tu API key.
3. En GitHub: Settings → Secrets and variables → Actions → New secret
   - Nombre: `PEXELS_API_KEY`
   - Valor: tu key
4. Listo. Sin este secret igual funciona (usa la lista de respaldo).

## Por qué es seguro

Pexels License permite uso comercial, modificación y redistribución sin
pedir permiso ni dar crédito: https://www.pexels.com/license/ — cero
riesgo de Content ID, a diferencia de transmisiones oficiales (FIFA+,
ESPN), que sí dan strike.

## Si querés fijar clips manualmente

Podés commitear tus propios `clip1.mp4`, `clip2.mp4`... acá. Si ya hay
3+ clips, el script los respeta y no descarga nada.
