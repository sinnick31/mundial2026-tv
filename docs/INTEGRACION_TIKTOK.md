# Integración TikTok — @elias.valdivia60

## Estado de auditoría

Auditoría inicial del repositorio `sinnick31/mundial2026-tv` en `main`.

- El pipeline actual renderiza MP4 verticales de 1080×1920 y valida presencia de video, audio, duración y tramos negros.
- `scripts/render-and-upload.js` está conectado a YouTube. No reutilizar su autorización ni cambiar su comportamiento para añadir TikTok.
- En los archivos revisados no se encontró una integración existente con TikTok.
- Perfil solicitado: https://www.tiktok.com/@elias.valdivia60

## Diseño propuesto

Mantener una ruta independiente para TikTok:

1. Reutilizar el MP4 ya renderizado solo después de pasar los controles editoriales y audiovisuales existentes.
2. Generar una descripción/caption específica para TikTok, sin marca de agua de YouTube ni enlaces promocionales incrustados en el video.
3. Usar la API oficial Content Posting API. Consultar primero `/v2/post/publish/creator_info/query/`, respetar las opciones de privacidad que devuelve y requerir consentimiento explícito para cada publicación.
4. Inicializar la publicación mediante `/v2/post/publish/video/init/`, cargar el archivo de acuerdo con el método autorizado y comprobar el resultado con el endpoint oficial de estado.
5. Mantener TikTok en modo desactivado hasta que la aplicación esté configurada y autorizada. Un error de TikTok nunca debe cancelar ni alterar una publicación de YouTube.

## Requisitos previos para Direct Post

- Registrar una aplicación en TikTok for Developers.
- Añadir el producto Content Posting API y habilitar Direct Post.
- Obtener aprobación del alcance `video.publish`.
- Autorizar explícitamente la cuenta de destino `@elias.valdivia60`.
- Completar la auditoría de la aplicación para poder optar a publicación pública. Las aplicaciones no auditadas tienen restricciones de visibilidad.
- Guardar credenciales únicamente como GitHub Actions Secrets. No incluir tokens, client secrets ni access tokens en archivos, logs, commits o artefactos.

Nombres previstos de secretos, solo después de implementar y revisar el cliente OAuth:
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_ACCESS_TOKEN`
- `TIKTOK_REFRESH_TOKEN` (si el flujo OAuth aprobado devuelve y requiere refresh token)

Los tokens son específicos de la autorización del usuario y deben renovarse conforme a la documentación oficial; no copiar credenciales de YouTube.

## Restricciones de publicación

- No publicar automáticamente de forma pública hasta que el alcance esté aprobado, la cuenta haya autorizado la app y la integración haya superado las verificaciones de TikTok.
- No asumir que el handle escrito equivale a una cuenta autorizada: la identidad del creador se confirma con la API.
- No insertar marcas de agua, logos o texto promocional sobre el video para TikTok.
- Mantener el control de derechos de imágenes, audio y clips. Un MP4 validado técnicamente no implica que sus derechos estén autorizados.
- La integración debe ejecutarse como workflow separado o paso explícitamente opt-in. No cambiar las variables, secretos, privacidad, OAuth ni lógica de subida de YouTube.

## Referencias oficiales

- Direct Post: https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post
- Inicio rápido: https://developers.tiktok.com/docs/en/content-posting-api-get-started
- Consulta de creador: https://developers.tiktok.com/docs/en/content-posting-api-reference-query-creator-info
- Guías de contenido compartido: https://developers.tiktok.com/docs/en/content-sharing-guidelines

## Estado actual

Documentación y auditoría inicial únicamente. La publicación automática aún no está configurada ni probada; no se ha creado ni utilizado ningún token de TikTok. La siguiente etapa requiere configurar la aplicación y la autorización oficial antes de habilitar un workflow de publicación.
