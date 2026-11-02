# Habilidades de YouTube para FÚTBOL CHILENSIS

Integración local de las 11 habilidades publicadas por [Jakeschincariol/chatgpt-youtube-agent-skill](https://github.com/Jakeschincariol/chatgpt-youtube-agent-skill), bajo licencia MIT. La licencia original se conserva en `UPSTREAM-LICENSE.txt`.

## Habilidades
- `yt-audit`
- `yt-chapters`
- `yt-comment`
- `yt-edit`
- `yt-package`
- `yt-plan`
- `yt-retention`
- `yt-script`
- `yt-seo`
- `yt-shorts`
- `yt-viral`

## Herramientas incluidas
- `yt-script/hookscore.py` y `yt-script/hooks.json`
- `yt-package/title.py`
- `yt-edit/deadair.py`
- `yt-chapters/chapters.py`
- `yt-retention/retention.py`
- `yt-viral/swipe.py`

Los scripts usan Python 3 y no requieren paquetes externos.

## Perfil editorial
Las habilidades leen `.codex/youtube/voice.md`. El perfil inicial define idioma, cobertura y reglas de verificación. La voz personal queda pendiente de transcripciones reales.

## Controles
- Estas habilidades generan análisis, guiones, metadatos y recomendaciones. No publican por sí mismas.
- No se agregaron credenciales, tokens, secretos ni llamadas a YouTube API.
- No se modificaron workflows, scripts de publicación, permisos ni configuración OAuth.
- Mantener revisión humana de fuentes, derechos audiovisuales y contenido antes de cualquier publicación.

## Pruebas locales
Desde la raíz del repositorio:

```bash
python3 .codex/skills/yt-script/hookscore.py --hook "Colo-Colo enfrenta una decisión clave antes de la próxima fecha"
python3 .codex/skills/yt-package/title.py --title "Colo-Colo: la decisión que puede cambiar la fecha" --thumb "SE DEFINE TODO"
python3 -m py_compile .codex/skills/yt-script/hookscore.py .codex/skills/yt-package/title.py .codex/skills/yt-edit/deadair.py .codex/skills/yt-chapters/chapters.py .codex/skills/yt-retention/retention.py .codex/skills/yt-viral/swipe.py
```

## Actualización
Antes de actualizar, comparar la versión upstream, revisar cambios y conservar las adaptaciones locales. No sobrescribir el perfil editorial sin revisar transcripciones nuevas.
