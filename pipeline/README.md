# Pipeline "Noticiario Fútbol Chile"

Convierte el canal en un noticiario automático de fútbol (prioridad: fútbol chileno masculino y femenino, luego internacional) con estilo de canal grande y **100 % recursos libres de derechos**.

## Qué produce (por edición, 08:00 y 20:00 Chile)
- `scripts/output/AAAA-MM-DD.txt` — guion de locutor (Abacus.AI, con plantilla de respaldo).
- `audio/output/AAAA-MM-DD.mp3` — narración voz chilena (edge-tts → gTTS de respaldo).
- `thumbnails/output/AAAA-MM-DD_{A,B,C}.png` — 3 miniaturas 1280x720 para pruebas A/B (la A también como `AAAA-MM-DD.png`).
- `videos/output/AAAA-MM-DD.mp4` — video 1280x720: intro → titulares 5→1 → noticias → outro.
- `videos/output/AAAA-MM-DD.metadata.json` — título, descripción y tags (dry-run si no se publica).

## Arquitectura
```
 cron 08:00/20:00 CL ─┐   workflow_dispatch (completo | solo_scraping | solo_video)
                      ▼
 ┌──────────────────────────────── GitHub Actions ─────────────────────────────────┐
 │ caché assets ─► assets/asset_downloader.py  (Pexels clips+fotos, ccMixter música) │
 │                        │                                                          │
 │ scraper/news_scraper.js ──► news_today.json                                       │
 │                        ▼                                                          │
 │ scripts/script_generator.js ──► guion .txt + pipeline_state.json                  │
 │        ├──► thumbnails/thumbnail_generator.py ──► PNG A/B/C                       │
 │        └──► tts/narrator.py ──► MP3                                               │
 │                        ▼                                                          │
 │ video/assembler.py (ffmpeg drawtext + fades) ──► MP4                              │
 │                        ▼                                                          │
 │ youtube/uploader.js ── UPLOAD_TO_YOUTUBE=true ? sube : dry-run                    │
 │                        ▼                                                          │
 │ artifacts: guion, miniaturas, video, metadatos, créditos (7 días)                 │
 └──────────────────────────────────────────────────────────────────────────────────┘
```
Cada paso tiene `continue-on-error`: si falla uno, los siguientes trabajan con lo disponible (sin clips → imágenes/color; sin música → base sintética; sin voz → solo música).

## Configurar secrets (Settings → Secrets and variables → Actions)
| Secret | Para qué | Cómo obtenerlo |
|---|---|---|
| `PEXELS_API_KEY` | Clips y fondos | Gratis en https://www.pexels.com/api/ |
| `YT_CLIENT_ID`, `YT_CLIENT_SECRET` | OAuth YouTube | Google Cloud Console → habilitar *YouTube Data API v3* → credencial OAuth "Aplicación de escritorio" |
| `YT_REFRESH_TOKEN` | Subir sin intervención | OAuth Playground (https://developers.google.com/oauthplayground) con tu client ID, scope `https://www.googleapis.com/auth/youtube.upload` y `youtube.force-ssl` |
| `ABACUS_API_KEY` (opcional) | Guion con IA | Abacus.AI → API Keys; sin ella se usa plantilla |

Variables (pestaña *Variables*): `UPLOAD_TO_YOUTUBE` (`false` por defecto), `BURN_SUBS` (`true` para quemar subtítulos), opcional `CHANNEL_NAME`.

## Ejecutar manualmente
GitHub → **Actions** → *Noticiario Fútbol Chile* → **Run workflow** → elegir modo:
- `solo_scraping`: solo actualiza `news_today.json`.
- `solo_video`: usa las noticias ya guardadas y genera guion, miniaturas, voz y video.
- `completo`: todo + subida (si está activada).
Descarga el resultado en la sección **Artifacts** de la ejecución para revisarlo.

Local:
```bash
npm install && pip install -r requirements-pipeline.txt   # requiere ffmpeg
python assets/asset_downloader.py
node scraper/news_scraper.js && node scripts/script_generator.js
python thumbnails/thumbnail_generator.py && python tts/narrator.py && python video/assembler.py
node youtube/uploader.js   # dry-run salvo UPLOAD_TO_YOUTUBE=true
```

## Activar la publicación automática
1. Revisa 2–3 ediciones en Artifacts.
2. Crea la variable de repositorio `UPLOAD_TO_YOUTUBE` = `true` (o marca "Subir a YouTube" en una ejecución manual).
3. Desde entonces cada ejecución programada sube el video con miniatura y registra las noticias en `processed_news.json` para no repetirlas.

## Créditos de recursos libres
Videos y fotos: **Pexels** (Pexels License). Música: **ccMixter** (CC BY, autores listados en `assets/credits.json`, que conviene pegar en la descripción) o base sintética propia. Fuentes tipográficas DejaVu (licencia libre). Detalle en `assets/sources.md`; estilo en `pipeline/STYLE_GUIDE.md`.

## Instalar el workflow
Por permisos de la integración, el archivo se entrega en `pipeline/workflows/football_news_pipeline.yml`. Cópialo a `.github/workflows/football_news_pipeline.yml` (GitHub → Add file → Create new file, pega el contenido) para activarlo.
