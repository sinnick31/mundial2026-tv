# Política de fuentes y derechos audiovisuales de FÚTBOL CHILENSIS

## Jerarquía editorial de noticias

1. **TNT Sports Chile** es la fuente periodística preferente. Sus noticias se descubren primero desde la portada oficial y desde sus secciones específicas.
2. **ESPN** es la segunda fuente periodística. Se consulta para cubrir asuntos que TNT no haya publicado, ampliar contexto o contrastar información.
3. **Otras fuentes verificables** complementan la cobertura. Los comunicados oficiales de clubes, ANFP y competiciones sirven para confirmar datos primarios, sin cambiar la preferencia editorial TNT/ESPN.

La jerarquía afecta el orden de descubrimiento y la puntuación de selección, no convierte una noticia en verdadera por el nombre de su medio. Cada pieza sigue necesitando artículo completo, URL original, fecha verificable y hechos contrastables. La relevancia, la actualidad y la diversidad editorial siguen contando.

## Jugadas, goles y material de transmisiones

- No descargar, recortar, retransmitir ni reutilizar goles, jugadas, resúmenes o fragmentos de transmisiones de TNT Sports, ESPN, ligas, clubes u otros titulares sin permiso o licencia explícita que cubra el uso previsto.
- Dar crédito, enlazar la fuente o añadir un aviso de no infracción no sustituye una autorización.
- El sistema no presume que un fragmento sea «uso legítimo» o «fair use». Las excepciones dependen de la jurisdicción y de una evaluación contextual; no son una casilla automática del pipeline.
- Para crónicas de partidos, el material audiovisual debe estar asociado al equipo correcto y contar con crédito, URL de procedencia, evidencia de autorización/licencia y permiso expreso para uso en YouTube.
- Si falta esa evidencia, el render de la crónica se bloquea. No se reemplaza por un clip de otro equipo ni por un vídeo de transmisión encontrado en internet.
- Las noticias pueden resolverse con gráficos, marcadores, mapas tácticos y animaciones originales. Las imágenes de clubes también deben contar con autorización documentada; si no, se utiliza la identidad gráfica de la plantilla.

## Metadatos requeridos para assets autorizados

Cada entrada de TEAM_IMAGES_JSON y TEAM_BROLL_MANIFEST debe incluir:

- rights: "authorized"
- credit: autor, club o titular que corresponda
- sourceUrl: URL HTTPS de procedencia
- authorizationReference: referencia identificable al permiso escrito, o licenseUrl: URL HTTPS de la licencia
- permittedUse: lista que incluya youtube o youtube_monetized
- team: equipo real al que pertenece el recurso
- En clips: file con nombre local permitido y existente

Un valor rights: "authorized" por sí solo no basta. Si la autorización no cubre YouTube o el uso monetizado previsto, el recurso no se considera apto.

## Controles del pipeline

- Los assets que no superen el control se descartan.
- Una crónica de partido sin clip autorizado y correctamente asociado queda bloqueada.
- Las noticias pueden renderizarse con plantillas gráficas originales cuando no hay imágenes licenciadas.
- RENDER_ONLY=true permite render local y validación, pero no autentica ni sube videos a YouTube.
