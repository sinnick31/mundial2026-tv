# ⚽ FOOTBALL AI STUDIO v4.0

> Antes: **Mundial2026 TV** (canal dependiente de un solo torneo).
> Ahora: **fábrica automática de contenido de fútbol 365 días al año**, con el fútbol chileno como ventaja competitiva.

Pipeline 100% automático y gratuito (GitHub Actions + APIs free tier) que busca noticias y resultados reales, decide qué tiene potencial viral, genera guiones con IA, renderiza Shorts verticales con Remotion y los publica en YouTube.

## 🎯 Qué cubre (365 días)

| Bloque | Fuente | Prioridad |
|---|---|---|
| 🇨🇱 **Fútbol chileno** — Primera A, Primera B, Copa Chile, La Roja | Google News RSS + ESPN (`chi.1`, `chi.copa_chi`) | **MÁXIMA** |
| 🏆 Champions League y Copa Libertadores | football-data.org + ESPN | Alta |
| 🌍 Premier, LaLiga, Serie A, Bundesliga, Ligue 1, Brasileirão | football-data.org (1 sola llamada multi-competición) | Media |
| 💰 Mercado de fichajes | Google News RSS | Alta |
| 📊 Récords, polémicas VAR, estadísticas | Detección por keywords + viral score | Media |
| 🏟️ Torneos FIFA (Mundial, Eurocopa) cuando estén activos | football-data.org | Alta |

## 🧠 Motor Viral Score (nuevo en v4)

Cada noticia recibe un puntaje **0–100** ANTES de gastar tokens de Gemini:
- Categoría (Chile +30, fichajes +20, polémicas +18…)
- Frescura (últimas 3h +15, más de 48h −10)
- Señales virales (OFICIAL, récord, marcador, cifras, VAR…)
- Clubes gigantes (+10)
- Penalización a contenido institucional/aburrido (−12)

Solo el Top sobre el umbral se convierte en video. **Mejor no publicar que publicar relleno.**

## 🔁 Flujo del pipeline

```
fetch-news.js (12 feeds, Chile primero) ──┐
fetch-matches.js (multi-competición)  ────┤
                                          ▼
                              viral-score.js (Top-N)
                                          ▼
                    generate-daily-content.js (Gemini 2.5 Flash)
                                          ▼
                     Remotion (render 9:16) ▶ YouTube API
                                          ▼
                    content-history.json (anti-duplicados)
```

Corre 3 veces al día según el workflow activo: 12:00 · 16:00 · 20:00, hora de Chile durante horario UTC−3 (cron UTC: 15:00 · 19:00 · 23:00). La fuente de verdad es `.github/workflows/futbol-pipeline.yml`; revisa la equivalencia local tras cambios de horario estacional.

## 📰 Sistema operativo editorial y monetización

La automatización técnica no sustituye el control editorial. Revisar fuentes, atribuciones, guion, derechos de imágenes/audio y resultado público; no publicar historias dudosas solo para llenar una ventana.

- [Sistema operativo de prensa de fútbol](docs/SISTEMA_OPERATIVO_PRENSA_FUTBOL.md)
- [Monetización y patrocinios](docs/MONETIZACION_Y_PATROCINIOS.md)
- [Control de calidad y correcciones](docs/CONTROL_CALIDAD_EDITORIAL.md)
- [Plan operativo de 30 días](docs/PLAN_30_DIAS.md)
- [Estrategia editorial del canal](CHANNEL_STRATEGY.md)

## ⚙️ Modos (workflow_dispatch)

El workflow activo ofrece: `chile` (enfoque Chile), `auto` (selección automática) y `noticias`. Los modos documentados en otros scripts no se consideran opciones disponibles hasta que estén declarados en `.github/workflows/futbol-pipeline.yml`.

## 🔑 Secrets requeridos

| Secret | Uso |
|---|---|
| `GEMINI_API_KEY` | Guiones y metadata con IA |
| `FOOTBALL_DATA_API_KEY` | Partidos y tablas (plan gratis) |
| `YOUTUBE_CLIENT_ID` / `SECRET` / `REFRESH_TOKEN` | Publicación automática |
| `PEXELS_API_KEY` | B-roll (opcional) |
| `COMPETITIONS` | *(opcional)* override de IDs de competiciones, ej: `2001,2021,2152` |

> `COMPETITION_ID` ya no se usa (era el candado del Mundial). Puedes borrarlo de los secrets.

## 📁 Archivos clave v4

- `config/ligas.js` — TODA la configuración: competiciones, equipos chilenos (A + B) con alias, categorías, feeds RSS
- `scripts/viral-score.js` — motor de puntaje 0–100
- `scripts/fetch-real-news.js` — ingesta activa de noticias con fuentes
- `scripts/fetch-matches.js` — partidos multi-competición y cobertura chilena estructurada
- `scripts/viral-score.js` — motor de puntuación editorial
- `scripts/generate-real-content.js` — selección y generación de contenido con controles de fuente
- `scripts/preflight-youtube-auth.js` — comprobación de autenticación antes de publicar
- `scripts/render-and-upload.js` — renderizado y publicación a YouTube

## 📌 Nota sobre la liga chilena

football-data.org (gratis) **no** incluye la Primera División de Chile. La cobertura chilena viene de dos fuentes que sí son gratis: **Google News RSS** (noticias, muy completo para Chile) y la **API pública de ESPN** (`chi.1` y `chi.copa_chi`) para marcadores de partidos.
