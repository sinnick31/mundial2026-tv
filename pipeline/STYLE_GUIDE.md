# Guía de estilo — Noticiario de fútbol (modelo GOAL · ESPN Fútbol · TNT Sports Chile)

Referencia editorial y visual que implementa el pipeline. Prioridad: **fútbol chileno (ANFP masculino + femenino)**, luego Selección y chilenos en el exterior, luego internacional.

## 1. Estructura del video (5–8 min)
| Tramo | Tiempo | Contenido | Implementación |
|---|---|---|---|
| Intro / gancho | 0–10 s | Logo/nombre del canal animado, música de entrada, "NOTICIAS FÚTBOL CHILE" | `video/assembler.py` → INTRO |
| Titulares | 10–25 s | Cuenta regresiva 5→1 con los titulares del día (3 s c/u) | TITULARES |
| Desarrollo | 25 s – 6 min | Una noticia por bloque: clip de fútbol + lower third (título, fuente) + narración | DESARROLLO |
| Outro | últimos 10 s | "¡SUSCRÍBETE!" pulsante, campanita, música de salida | OUTRO |

Reglas: la noticia más fuerte primero; cada bloque 30–60 s; nunca inventar datos (solo lo que dice la fuente); citar fuente en pantalla.

## 2. Títulos ganadores
Fórmula: `[EMOJI] [GANCHO] + [PROTAGONISTA] + [DATO] | [CONTEXTO]` — máx. 70 caracteres, palabra clave al inicio.
- Ganchos: **OFICIAL**, **BOMBA**, **EXCLUSIVO**, **ÚLTIMA HORA**, **CONFIRMADO** (solo si la fuente lo respalda).
- Números: "5 NOTICIAS", "3 BAJAS", "TOP 5".
- Emojis: 🚨 urgente · 🔥 tendencia · ⚽ partido · 🇨🇱 Chile · ✅ oficial · 👀 rumor.
- Ejemplos: `🚨 OFICIAL: La Roja confirma su primera baja ante Colombia 🇨🇱` · `🔥 5 NOTICIAS del fútbol chileno HOY | Colo Colo, U de Chile y La Roja Femenina`.

## 3. Estilo visual
- Paleta: azul Chile `#0039A6`, rojo `#D52B1E`, blanco, acento amarillo `#FFD700`, rojo "breaking" `#E10600`.
- Tipografía sans bold en mayúsculas, borde negro 3–8 px (legible en móvil).
- Miniatura: fondo de acción/estadio saturado, 2–3 palabras gigantes, gradiente oscuro inferior, bandera/escudo en esquina, etiqueta roja de gancho. Variantes A/B/C para "Probar y comparar" de YouTube Studio.
- Lower thirds sólidos con franja roja; transiciones con fade de 0,5 s.

## 4. Audio
Voz `es-CL-LorenzoNeural` (tono locutor deportivo, ritmo ágil); música épica/deportiva al 12 % bajo la voz y al 80–90 % en intro/outro.

## 5. Cadencia de publicación
- 2 ediciones diarias: **08:00** (resumen de la noche) y **20:00** (cierre del día) hora de Chile.
- Días de fecha ANFP/Selección: añadir Shorts verticales (30–60 s) con el titular principal.
- Mantener horario fijo; los canales grandes publican a diario a la misma hora para entrenar a la audiencia.
