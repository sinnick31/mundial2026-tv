# Sistema operativo editorial: MUNDIAL2026SHORTS

**Versión:** 1.0 · **Zona horaria:** America/Santiago · **Propietario editorial:** responsable del canal.

**Propósito:** operar como una redacción digital de fútbol: publicar información útil, original y verificada, con un proceso repetible sin convertir cada vídeo en una copia del anterior.

## 1. La promesa editorial

**Promesa al público:** “Te contamos qué pasó en el fútbol, qué está confirmado y por qué importa, con prioridad para Chile y mirada internacional”.

El canal no es un canal oficial de un club ni un canal limitado al Mundial 2026. Es un medio de fútbol durante todo el año. Colo-Colo tiene atención prioritaria cuando hay información relevante, pero ninguna institución o hinchada debe monopolizar la cobertura.

### Jerarquía y mezcla editorial orientativa

- **55 %: fútbol chileno**, incluyendo Liga de Primera, Ascenso, Segunda División, Copa Chile, Copa de la Liga, Supercopa, fútbol femenino, selecciones, formativo, futsal y categorías regionales cuando haya fuentes sólidas.
- **15 %: chilenos en el extranjero y selecciones chilenas**, con seguimiento a clubes, rendimiento, convocatorias y declaraciones.
- **30 %: fútbol internacional**, incluidas competiciones de clubes, selecciones, fútbol femenino y grandes historias globales, aunque no estén relacionadas directamente con Chile.

Es una guía para el conjunto de publicaciones de la semana, no una cuota rígida para cada día. Dentro de la cobertura chilena, Colo-Colo recibe prioridad cuando la noticia lo justifica; también se debe dar espacio a Universidad de Chile, Universidad Católica, Coquimbo Unido, equipos de regiones, Ascenso y otras competiciones con hechos relevantes. Si no hay una historia suficientemente buena, se espera a la siguiente ventana.

## 2. Líneas editoriales

Cada pieza debe pertenecer a una serie reconocible y tener una historia propia:

1. **Última hora confirmada:** decisiones, convocatorias, sanciones, declaraciones y cambios relevantes con fuente directa.
2. **El mapa del fútbol chileno:** resultados, tabla, calendario, ascenso, copas y equipos fuera del foco habitual.
3. **Colo-Colo al detalle:** actualidad, decisiones deportivas y contexto; sin presentar rumores como información oficial.
4. **Chilenos por el mundo:** rendimiento y noticias verificables de futbolistas y entrenadores.
5. **Fútbol global:** una noticia internacional explicada en lenguaje claro y con contexto útil.
6. **Análisis y explicación:** qué cambia, qué dicen los datos disponibles y qué sigue en juego.
7. **Fútbol femenino y desarrollo:** cobertura planificada y constante, no solo en fechas excepcionales.

No se debe forzar una noticia en una categoría para rellenar el calendario.

## 3. Ritmo y ventanas de producción

El workflow actual tiene tres horarios programados: **12:00, 16:00 y 20:00, hora de Chile** (cron de GitHub Actions: 15:00, 19:00 y 23:00 UTC durante el horario UTC−3). La documentación debe mantenerse alineada con el archivo .github/workflows/futbol-pipeline.yml; cualquier cambio horario se verifica en ese archivo.

### Rutina por ventana

**Antes de seleccionar**
- Revisar noticias nuevas y descartar duplicados.
- Identificar fecha de publicación y fecha del hecho.
- Puntuar actualidad, relevancia, calidad de fuente y aporte propio.
- Elegir una sola historia principal por defecto. No aumentar el volumen a costa de la calidad.

**Antes de publicar**
- Validar fuente, titular, guion, visuales, subtítulos y pronunciación.
- Verificar que el guion responda a la noticia y añada contexto propio.
- Bloquear afirmaciones de alto riesgo cuando no estén corroboradas.
- Confirmar que no existan clips de transmisión sin permiso/licencia y que la miniatura no prometa más de lo que entrega el vídeo.

**Después de publicar**
- Comprobar que la URL pública funciona y que título, descripción, categoría y vídeo corresponden al contenido.
- Registrar el resultado de GitHub Actions y cualquier incidencia.
- Revisar resultados de audiencia después de 24 horas y nuevamente a los 7 días. No juzgar una idea por unas pocas horas de datos.

### Ritmo recomendado durante la etapa de relanzamiento

- Priorizar **1 Short sólido al día** como mínimo editorial, con hasta 2 o 3 cuando existan historias distintas y de valor.
- Publicar **un vídeo largo semanal** cuando exista material suficiente para un resumen o análisis original de 5–8 minutos.
- No crear una publicación solo porque se abrió una ventana automática. Una ejecución sin historia apta es un resultado correcto.

La automatización actual puede publicar por sí sola. Hasta que la fiabilidad editorial esté demostrada con una muestra suficiente, revisar manualmente el guion, las fuentes y el vídeo final de cada publicación; si no puede revisarse, reducir el riesgo de los temas y pausar la auto-publicación cuando aparezca una alerta.

## 4. El proceso editorial de principio a fin

~~~text
Descubrir fuentes
   ↓
Normalizar noticia y fecha
   ↓
Comprobar duplicados / historia previa
   ↓
Clasificar categoría y riesgo
   ↓
Verificar fuente primaria y corroborar cuando corresponda
   ↓
Puntuar valor editorial
   ↓
Escribir guion original y atribuido
   ↓
Seleccionar visuales con derechos claros
   ↓
Renderizar / revisión final
   ↓
Publicar y comprobar URL
   ↓
Medir a 24 h y 7 días
   ↓
Registrar aprendizaje para la próxima pieza
~~~

### Niveles de confianza de fuentes

- **Nivel A, fuente primaria:** comunicados del club, federación, competición, tribunal deportivo, actas, convocatorias y declaraciones completas publicadas por el protagonista o la institución.
- **Nivel B, medio periodístico identificable:** una redacción reconocible que atribuye el dato y publica contexto y fecha. Para fichajes, lesiones, sanciones, renuncias o polémicas, buscar una segunda fuente fiable o la fuente primaria.
- **Nivel C, pista no confirmada:** redes sociales sin autor verificable, cuentas anónimas, capturas sin enlace, rumores replicados sin origen, titulares sin texto o contenido antiguo reciclado. Sirve para investigar, **no para publicar como hecho**.

Las fuentes pueden discrepar. Si no se puede resolver la diferencia, el guion debe explicitar qué afirma cada fuente o la historia queda en espera.

### Puntaje editorial interno (0–10)

Asigna 0, 1 o 2 puntos a cada criterio: **fiabilidad**, **actualidad**, **interés para la audiencia**, **contexto/aporte original** y **claridad visual**.

- **8–10:** candidato a producirse, siempre que pase los controles obligatorios.
- **6–7:** investigar más, acotar el ángulo o guardar para una actualización.
- **0–5:** no publicar.

Una puntuación alta jamás compensa la falta de fuente o de derechos. Esos controles son bloqueos, no puntos negociables.

## 5. Guion y gancho

### Estructura sugerida para Shorts

- **0–2 segundos:** hecho concreto, actor y tensión informativa real.
- **2–7 segundos:** qué pasó, en qué competición y cuándo.
- **7–20 segundos:** contexto y 1–3 datos verificados que no repitan el titular.
- **20–35 segundos:** análisis del canal, separado de los hechos.
- **Cierre:** pregunta precisa o qué debe observarse a continuación.

La duración se adapta a la noticia. Una pieza puede durar menos; no se estira con repeticiones. En historias complejas, dividir hechos y análisis con claridad o preparar un vídeo largo.

### Gancho correcto versus gancho engañoso

**Correcto:** “La ANFP confirmó [decisión concreta]. Esto es lo que cambia para [equipo/torneo]”. Solo se usa si la confirmación existe.  
**Correcto si hay incertidumbre:** “Esto es lo que se sabe y lo que todavía no está confirmado sobre [tema]”.  
**Incorrecto:** “BOMBAZO OFICIAL” cuando solo hay un rumor, o prometer un fichaje en el título cuando el vídeo explica que no hay confirmación.

No hay un gancho que garantice que YouTube recomiende un vídeo. Cada título y apertura se prueban contra los resultados reales de la audiencia.

### Diferencia de cada pieza

Cada vídeo necesita un ángulo narrativo propio, un dato central, contexto específico y una conclusión. Se permite una identidad gráfica estable, pero no producir vídeos intercambiables con la misma narración, imágenes genéricas y apenas el nombre de un club cambiado. La IA puede preparar borradores; el editor decide el enfoque y responde por la exactitud.

## 6. Imagen, audio y derechos

Orden de preferencia visual:

1. Gráficos originales hechos con datos verificados: marcador, calendario, tabla, cronología o ficha del jugador.
2. Fotografías o vídeo propios.
3. Material con licencia compatible y prueba de derechos conservada.
4. Material autorizado por el titular, con alcance, plataformas, duración y créditos acordados.
5. Recursos genéricos licenciados como apoyo, solo si representan con honestidad lo que se narra.

**No reutilizar goles, resúmenes o capturas de transmisiones deportivas sin permiso/licencia confirmados.** Que un clip esté en internet, que tenga crédito o que se use pocos segundos no lo hace automáticamente libre de derechos. La excepción de copyright depende de la ley y de las circunstancias, y no garantiza monetización.

Para imágenes de equipos, usar el proceso descrito en docs/IMAGENES_EQUIPOS.md; mantener la evidencia de licencias fuera de los archivos públicos si contiene información privada. Si no hay visual autorizado, usar diseño editorial original en vez de descargar una fotografía al azar.

### Estándar audiovisual

- Vertical 9:16 para Shorts; horizontal 16:9 para vídeos largos.
- Subtítulos grandes, con contraste y revisión manual de nombres propios.
- Voz clara, pronunciación chilena natural y ritmo conversacional, no locución robótica acelerada.
- Cambios visuales motivados por la historia, no movimiento decorativo constante.
- Música solo con permiso o licencia adecuada y respetando sus condiciones.
- Si se crean escenas realistas sintéticas que puedan confundirse con hechos reales, usar la divulgación correspondiente de YouTube. La asistencia de IA que no representa falsamente eventos reales no requiere automáticamente el mismo tratamiento.

## 7. Checklist de salida

No publicar hasta confirmar todos los controles obligatorios:

- [ ] La URL de la fuente abre y corresponde al hecho descrito.
- [ ] El nombre de la fuente, su fecha y la fecha del hecho están distinguidos.
- [ ] Cada frase factual es trazable; las declaraciones están atribuidas.
- [ ] Las noticias de alto riesgo cuentan con corroboración suficiente.
- [ ] El guion añade explicación propia y no copia el artículo ni la narración de otro canal.
- [ ] El gancho, el título y la miniatura no exageran lo que se sabe.
- [ ] Los visuales, música y recursos de terceros están autorizados para el uso previsto.
- [ ] Se revisaron audio, subtítulos, escudos, nombres, cifras y fecha.
- [ ] La exportación y la URL de YouTube se verifican.
- [ ] Se conserva una referencia de la fuente, los derechos y el resultado de la publicación.

**Bloqueo inmediato:** fuente ausente; rumor escrito como hecho confirmado; acusación sin sustento; fecha engañosa; clip de partido sin derechos; miniatura falsa; error sustancial de equipo/jugador/resultado; o duplicado sin actualización relevante.

## 8. Métricas que dirigen decisiones

| Indicador | Qué diagnostica | Qué cambiar en la próxima prueba |
|---|---|---|
| Se quedaron para mirar / deslizaron (Shorts) | Fuerza del primer segundo y del encuadre | Primeras palabras, primera imagen, claridad del tema |
| Retención en 1–3 s | Si la promesa inicial se entiende | Eliminar saludo, logo largo y contexto innecesario |
| Duración media y porcentaje visto | Ritmo, claridad y densidad | Recortar repeticiones, adelantar dato clave |
| Visualizaciones y espectadores recurrentes | Interés y hábito de audiencia | Series editoriales y consistencia temática |
| CTR de impresiones (vídeos largos) | Alineación de miniatura y título | Probar otro enfoque visual/titular |
| Suscriptores ganados por vídeo | Conversión de interés en relación duradera | Reforzar la promesa del canal y las series |

Comparar ventanas equivalentes y grupos de vídeos con un tema parecido. Cambiar una variable a la vez. Registrar el tamaño de muestra y no proclamar un ganador por un único vídeo con pocas impresiones.

### Revisión semanal de 30 minutos

1. Identificar las 3 publicaciones con mejor resultado y las 3 más débiles.
2. Leer retención y comentarios, no solo las vistas totales.
3. Anotar qué tema, gancho y formato parecen explicar la diferencia.
4. Elegir dos experimentos para la semana siguiente.
5. Revisar errores, reclamaciones, correcciones y derechos.
6. Actualizar backlog y calendario editorial.

## 9. Comunidad y correcciones

- Responder a comentarios de buena fe con información y preguntas concretas.
- No insultar, acosar, doxxear ni fomentar peleas entre hinchadas.
- Corregir rápido un error factual: actualizar descripción o comentario fijado cuando sea útil, y editar, retirar o republicar según la gravedad.
- Si una imagen o clip recibe una reclamación de derechos, comprobar la licencia y la reclamación antes de volver a usarlo. No disputar automáticamente.
- Conservar un registro privado de correcciones y autorizaciones. No publicar datos personales, tokens ni credenciales.

## 10. Quién decide qué

**Responsable editorial humano:** selecciona ángulo, verifica el hecho, autoriza recursos, revisa el producto final y resuelve correcciones.  
**Automatización:** descubre fuentes, agrupa duplicados, puntúa, prepara borradores, renderiza, publica cuando el modo operativo lo permite y registra resultados.  
**IA generativa:** ayuda a resumir y redactar; nunca es la fuente de verdad ni puede inventar citas, resultados, estadísticas o declaraciones.

El pipeline debe detenerse ante errores de fuente, autenticación, render o verificación de subida. Una ejecución “success” certifica que pasaron los pasos técnicos configurados, no que el contenido sea periodísticamente impecable.

## 11. Documentos relacionados

- CHANNEL_STRATEGY.md: resumen de la estrategia del canal.
- docs/MONETIZACION_Y_PATROCINIOS.md: monetización por etapas.
- docs/CONTROL_CALIDAD_EDITORIAL.md: lista de aprobación y registro de incidencias.
- docs/PLAN_30_DIAS.md: aplicación gradual y revisión del sistema.
- docs/IMAGENES_EQUIPOS.md: gestión de imágenes autorizadas.
