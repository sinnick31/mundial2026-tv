# Fuentes de assets libres de derechos

Solo se usan recursos con licencia que permite uso comercial en YouTube. `assets/asset_downloader.py` guarda el autor y la URL de cada recurso en `assets/credits.json`.

## Videos (→ `assets/clips/`)
| Fuente | URL | Licencia | Búsquedas |
|---|---|---|---|
| Pexels Videos (API automática) | https://www.pexels.com/videos/ · API: https://www.pexels.com/api/ | Pexels License (uso libre, sin atribución obligatoria) | `soccer`, `football stadium`, `goal celebration`, `football training` |
| Pixabay Videos | https://pixabay.com/videos/ | Pixabay Content License | mismas búsquedas |
| Coverr | https://coverr.co/ | Coverr License | `soccer`, `stadium` |

## Música (→ `assets/music/`)
| Fuente | URL | Licencia | Géneros |
|---|---|---|---|
| ccMixter (API automática, filtro `lic=by`) | https://ccmixter.org/ | CC BY (atribuir autor) | epic, sport, dramatic (instrumental) |
| Free Music Archive | https://freemusicarchive.org/ | Revisar cada pista: usar CC BY / CC0 | sport, epic, cinematic |
| YouTube Audio Library | https://studio.youtube.com → Biblioteca de audio | Libre para YouTube (algunas piden atribución) | Dramática, Inspiradora, Deportes |

Descargas directas propias: definir el secret/variable `MUSIC_URLS` con URLs `.mp3` separadas por comas. Si nada está disponible, el descargador genera una base rítmica sintética local.

## Imágenes (→ `assets/backgrounds/stadiums/`)
| Fuente | URL | Licencia | Búsquedas |
|---|---|---|---|
| Pexels Photos (API automática) | https://www.pexels.com/ | Pexels License | `football stadium`, `soccer ball`, `stadium crowd` |
| Unsplash | https://unsplash.com/ | Unsplash License | estadios, balones, hinchada |
| Pixabay | https://pixabay.com/ | Pixabay Content License | estadios, multitudes |

## Iconos y escudos
- Bandera de Chile dibujada programáticamente (dominio público) en `thumbnails/thumbnail_generator.py`.
- Escudos de clubes: **no** usar logos registrados; usar texto/colores del club o íconos CC0 (p. ej. https://openmoji.org, CC BY-SA, atribuir).

> Nota: no se usan imágenes ni clips de transmisiones oficiales (CDF, TNT, ESPN) para evitar reclamos de Content ID.
