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

Corre 4 veces al día (horario Chile): 08:00 · 12:00 · 17:00 · 21:00.

## ⚙️ Modos (workflow_dispatch)

`auto` · `noticias` · `partidos` · `predicciones` · `ranking` · **`chile`** (solo fútbol chileno) · **`fichajes`** (solo mercado)

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
- `scripts/fetch-news.js` — noticias multi-tema con clasificación por categoría
- `scripts/fetch-matches.js` — partidos multi-competición (1 llamada API) + liga chilena vía ESPN
- `scripts/generate-daily-content.js` — generación IA con prompts genéricos y cupo garantizado para Chile

## 📌 Nota sobre la liga chilena

football-data.org (gratis) **no** incluye la Primera División de Chile. La cobertura chilena viene de dos fuentes que sí son gratis: **Google News RSS** (noticias, muy completo para Chile) y la **API pública de ESPN** (`chi.1` y `chi.copa_chi`) para marcadores de partidos.
