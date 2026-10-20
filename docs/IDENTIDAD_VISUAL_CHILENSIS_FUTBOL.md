# Chilensis Fútbol — identidad visual y sistema de contenidos

## Objetivo de marca

Construir una marca editorial deportiva chilena, independiente y reconocible. Tomar como referencias funcionales la claridad televisiva de TNT Sports Chile, la velocidad informativa asociada al periodismo de fichajes y la conversación analítica de ESPN FC, sin copiar logos, tipografías propietarias, frases, plantillas exactas, voces ni recursos audiovisuales de terceros.

**Promesa editorial:** “Qué pasó, qué está confirmado y por qué importa”.

## Sistema visual propuesto

- **Color principal:** azul noche `#101827`, para fondos y paneles.
- **Color de acción:** rojo cancha `#E63946`, para alertas editoriales reales y acentos.
- **Color de datos:** blanco `#F8FAFC` y gris `#CBD5E1`, para legibilidad.
- **Color de resultado:** verde `#22C55E`, solo para estados positivos o marcador final cuando corresponda.
- **Tipografía:** una sans-serif de uso libre y alta legibilidad, por ejemplo Inter o Atkinson Hyperlegible. Confirmar licencia antes de empaquetar archivos de fuentes.
- **Composición:** jerarquía de tres niveles: hecho principal, contexto breve, identificación de fuente/fecha.
- **Marca:** texto “CHILENSIS FÚTBOL” y símbolo original de balón/línea de cancha. No usar escudos oficiales como logotipo del canal.
- **Accesibilidad:** alto contraste, subtítulos quemados en Shorts, textos cortos y evitar que el color sea el único indicador.

### Reglas para miniaturas

1. Un tema principal por miniatura.
2. Titular breve, idealmente de 3 a 6 palabras, sin afirmar algo que la noticia no demuestra.
3. Un protagonista visual con derechos verificados o un gráfico original.
4. Mantener zona segura y legibilidad en pantalla móvil.
5. No usar insignias de “OFICIAL” o “CONFIRMADO” sin evidencia primaria.
6. No reutilizar la misma composición como sustituto de una idea editorial distinta.

### Plantillas de producción

- **Última hora verificada:** etiqueta discreta, hecho, hora local y fuente.
- **Marcadores:** equipos, resultado comprobado, competición y fecha; nunca reconstruir imágenes de transmisión sin autorización.
- **Análisis:** pregunta central, dato verificable y conclusión editorial.
- **Chilenos por el mundo:** jugador, club actual verificado, actuación/dato y contexto.
- **Resumen diario:** tarjetas de noticias independientes y cierre con lo que sigue.

## Sistema editorial

### Pilares y mezcla de referencia

- 55 % fútbol chileno: Liga de Primera, Ascenso, Segunda, Copa Chile, fútbol femenino, selecciones y categorías formativas/regionales con fuentes fiables.
- 15 % futbolistas y entrenadores chilenos en el extranjero, además de selecciones.
- 30 % fútbol internacional.
- Colo-Colo recibe prioridad cuando la relevancia y la evidencia lo justifiquen, pero no desplaza automáticamente a los demás clubes.

Los porcentajes orientan la planificación y nunca obligan a publicar una noticia débil.

### Formatos

- **Short de noticia:** 25–45 s, un hecho y una explicación propia.
- **Short de contexto:** 35–60 s, qué se sabe, qué no se sabe y por qué importa.
- **Resumen de jornada:** 6–10 min, solo cuando haya suficientes partidos/resultados confirmados.
- **Análisis largo:** 8–12 min, una pregunta central, fuentes visibles y argumentos diferenciados.
- **Actualización en vivo:** publicar solo si hay información confirmada nueva; corregir o retirar si aparece evidencia contraria.

### Estructura narrativa para Shorts

1. **0–3 s:** el hecho concreto o la pregunta informativa, sin clickbait engañoso.
2. **3–12 s:** qué ocurrió y a quién afecta.
3. **12–30 s:** contexto, comparación o consecuencia respaldada.
4. **Cierre:** qué observar después o una pregunta específica a la audiencia.
5. **En pantalla/descripción:** fuente, fecha y contexto suficiente para verificar.

## Protocolo de verificación

Cada historia debe conservar:
- URL de la fuente y fecha/hora de consulta.
- Fecha del hecho, diferenciada de la fecha de publicación.
- Cita o extracto mínimo que respalde el hecho, sin copiar artículos enteros.
- Estado: `verified`, `needs_review` o `rejected`.
- Evidencia primaria cuando exista: club, competición, federación, comunicado, acta o entrevista original.
- Una segunda fuente independiente para afirmaciones controvertidas, sensibles o que no provengan directamente de la entidad involucrada.

**Bloquear publicación** si faltan fuentes, hay contradicciones sin resolver, la noticia depende de un rumor sin atribución, o no se conocen los derechos del material visual. La IA puede resumir y proponer, pero no declarar un dato verdadero por sí sola.

## Derechos y originalidad

- No descargar ni republicar goles, transmisiones, fotografías o clips de otros canales sin licencia o autorización documentada.
- Dar crédito no equivale a obtener permiso.
- Preferir narración propia, gráficos originales, tablas, mapas de cancha propios, animación simple y fotografías con licencia compatible.
- Guardar el origen y la licencia de cada recurso visual.
- Evitar publicaciones masivas con guiones y estructuras prácticamente idénticos. Cada pieza debe aportar contexto, análisis o narración propios.

## Flujo automatizado objetivo

`fuentes → normalización → deduplicación → puntuación → revisión factual → guion original → control de derechos → render → revisión final → publicación → comprobación → métricas`

### Puertas de control

- **Gate A, fuentes:** URLs válidas, fechas y evidencia almacenadas.
- **Gate B, editorial:** afirmaciones respaldadas, atribución clara y sin datos inventados.
- **Gate C, derechos:** todos los recursos audiovisuales tienen licencia/permiso o son originales.
- **Gate D, render:** archivo existente, duración válida, audio y relación de aspecto correctos.
- **Gate E, publicación:** credenciales disponibles y respuesta de YouTube confirmada.
- Si un gate falla, registrar el motivo y detener esa pieza. No publicar automáticamente como alternativa.

## Producción con presupuesto cero

- GitHub Actions para orquestación, sujeto a límites de uso y disponibilidad.
- Herramientas locales existentes del repositorio para guiones, gráficos y render.
- Recursos propios, gráficos vectoriales originales y materiales con licencia verificada.
- No depender de APIs de pago ni de fuentes inventadas.
- Mantener los secretos solo en GitHub Actions Secrets; nunca escribir tokens en archivos, logs o commits.

## Métricas y aprendizaje

A las 24 horas y 7 días, registrar:
- Shorts: visto frente a deslizado, retención inicial, duración media, porcentaje visto y suscriptores ganados.
- Largos: impresiones, CTR, duración media, retención por sección y espectadores recurrentes.
- Calidad: fuentes verificadas, correcciones, reclamaciones, fallos de render y publicaciones fallidas.

Comparar piezas del mismo formato y cambiar una variable por vez. No declarar una fórmula viral con muestras pequeñas.

## Criterios de aceptación

- El paquete visual es consistente y original.
- Cada historia publicada tiene fuentes consultables.
- Ningún recurso audiovisual se usa sin permiso/licencia verificada.
- El fallo de una etapa bloquea la publicación y deja un log útil.
- Se conserva la publicación manual como alternativa hasta validar el flujo completo.
- La automatización no modifica ni elimina el historial editorial existente.
