# Skills de YouTube para FÚTBOL CHILENSIS

Esta es la ubicación canónica de las 11 skills de proyecto para OpenAI Codex: `.agents/skills/<skill>/SKILL.md`. Codex descubre skills del repositorio en esta ruta. La guía raíz `AGENTS.md` indica cuándo leerlas y aplicarlas.

## Skills instaladas

| Skill | Uso |
|---|---|
| `yt-audit` | Auditoría integral del canal |
| `yt-chapters` | Capítulos y marcas de tiempo |
| `yt-comment` | Comentarios y comunidad |
| `yt-edit` | Edición y detección de silencios |
| `yt-package` | Títulos y miniaturas |
| `yt-plan` | Planificación editorial |
| `yt-retention` | Retención y análisis |
| `yt-script` | Guiones y ganchos |
| `yt-seo` | SEO y metadatos |
| `yt-shorts` | Adaptación a Shorts |
| `yt-viral` | Evaluación de ideas y tendencias |

## Herramientas incluidas

- `yt-script/hookscore.py` y `yt-script/hooks.json`
- `yt-package/title.py`
- `yt-edit/deadair.py`
- `yt-chapters/chapters.py`
- `yt-retention/retention.py`
- `yt-viral/swipe.py`

Los scripts usan Python 3 y no requieren paquetes externos. Ejecuta desde la raíz del repositorio:

```bash
python3 .agents/skills/yt-script/hookscore.py --hook "Colo-Colo enfrenta una decisión clave antes de la próxima fecha"
python3 .agents/skills/yt-package/title.py --title "Colo-Colo: la decisión que puede cambiar la fecha" --thumb "SE DEFINE TODO"
python3 -m py_compile .agents/skills/yt-script/hookscore.py .agents/skills/yt-package/title.py .agents/skills/yt-edit/deadair.py .agents/skills/yt-chapters/chapters.py .agents/skills/yt-retention/retention.py .agents/skills/yt-viral/swipe.py
```

## Perfil editorial y salvaguardas

Las skills leen el perfil editorial en `.codex/youtube/voice.md`. La voz personal todavía debe ajustarse con transcripciones reales del canal. El agente debe respetar `AGENTS.md`: fuentes verificables, fútbol chileno masculino y femenino, no inventar datos y revisión humana antes de publicar.

Estas skills generan análisis y materiales. No publican por sí solas ni modifican OAuth, secretos o el workflow de YouTube. La presencia de los archivos permite que Codex las descubra; la ejecución real se confirma por tarea y por las pruebas de sus scripts.

## Licencia y procedencia

Integración basada en [Jakeschincariol/chatgpt-youtube-agent-skill](https://github.com/Jakeschincariol/chatgpt-youtube-agent-skill), bajo licencia MIT. Se conserva la licencia upstream en `UPSTREAM-LICENSE.txt`.
