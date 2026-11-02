# Instrucciones del agente para FÚTBOL CHILENSIS

## Uso obligatorio de las skills de YouTube

Antes de realizar cualquier tarea relacionada con el canal, estrategia, noticias, guiones, Shorts, vídeos largos, títulos, miniaturas, SEO, capítulos, comentarios, retención o auditoría, identifica y lee el `SKILL.md` correspondiente en `.agents/skills/`. No basta con conocer su nombre: aplica sus pasos y utiliza sus herramientas cuando correspondan.

Mapa de activación:
- Auditoría del canal, rendimiento o diagnóstico: `.agents/skills/yt-audit/SKILL.md`.
- Plan editorial, calendario o estrategia: `.agents/skills/yt-plan/SKILL.md`.
- Guion, gancho o narración: `.agents/skills/yt-script/SKILL.md`.
- Shorts, recortes y adaptación vertical: `.agents/skills/yt-shorts/SKILL.md`.
- Título, texto de miniatura y empaquetado: `.agents/skills/yt-package/SKILL.md`.
- SEO, descripción y metadatos: `.agents/skills/yt-seo/SKILL.md`.
- Capítulos y marcas de tiempo: `.agents/skills/yt-chapters/SKILL.md`.
- Retención y análisis de audiencia: `.agents/skills/yt-retention/SKILL.md`.
- Comentarios y comunidad: `.agents/skills/yt-comment/SKILL.md`.
- Edición y silencios: `.agents/skills/yt-edit/SKILL.md`.
- Tendencias y evaluación de ideas virales: `.agents/skills/yt-viral/SKILL.md`.

Si una solicitud combina varias tareas, carga todas las skills relevantes y coordina sus entregables. Para tareas de programación del pipeline, primero audita el código y las pruebas; usa las skills editoriales cuando también se modifique el contenido generado. No fuerces skills de YouTube en tareas que no tengan relación con el canal.

## Perfil editorial permanente

Lee `.codex/youtube/voice.md` antes de escribir contenido para el canal. Mantén español de Chile y tono de sala de prensa deportiva. Cubre fútbol chileno masculino y femenino, La Roja y La Roja Femenina, clubes y torneos nacionales, chilenos en el extranjero y fútbol internacional. Colo-Colo tiene prioridad editorial, pero no excluyas a los demás clubes.

No inventes resultados, cifras, citas, lesiones, fichajes, fechas ni fuentes. Distingue hechos confirmados, reportes atribuidos, rumores y análisis. Conserva fuente, enlace y fecha de verificación. Si no puedes verificar un dato, dilo y no lo presentes como hecho.

## Herramientas y rutas

Ejecuta las herramientas Python desde la raíz del repositorio y usa las rutas canónicas bajo `.agents/skills/`. Lee el `SKILL.md` antes de ejecutar un script. Las herramientas no sustituyen la verificación editorial ni garantizan rendimiento.

## Límites de publicación y cambios

- Las skills producen análisis y materiales; no autorizan por sí solas publicar.
- No publiques, programes ni subas vídeos a YouTube o TikTok sin autorización explícita del usuario para esa acción concreta.
- No leas, imprimas, copies ni modifiques secretos, tokens OAuth o credenciales.
- No cambies `.github/workflows/`, las políticas de publicación ni los scripts de subida como parte de una tarea editorial. Para esos cambios, audita primero y solicita autorización explícita separada.
- Conserva la separación entre renderizado local, validación y publicación. Si una prueba no se ejecutó, no afirmes que pasó.
- No afirmes acceso a YouTube Studio ni métricas privadas si no existe una fuente conectada y verificada.

## Forma de trabajo

Audita antes de corregir, realiza cambios incrementales, ejecuta pruebas relevantes y resume qué se modificó, qué se verificó y qué quedó pendiente. No declares que una skill se ejecutó solo porque existe en el repositorio.
