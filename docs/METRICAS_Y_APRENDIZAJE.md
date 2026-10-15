# Métricas y ciclo de aprendizaje

## 1. La pregunta central

No optimizar solo para vistas. Un video útil tiene que conseguir que la persona elija verlo, entienda la historia, se quede el tiempo suficiente, confíe en la marca y tenga una razón para regresar.

## 2. Métricas por formato

### Shorts
- **Mostrado en el feed:** cuántas veces se mostró el Short en el feed.
- **Vieron frente a deslizaron / Stayed to watch:** proporción de ocasiones en las que el espectador eligió ver frente a deslizar.
- **Visualizaciones interesadas / Engaged views:** visualizaciones que superan los segundos iniciales según la definición vigente de YouTube Analytics.
- **Duración media de visualización:** cuánto tiempo miran en promedio quienes se quedan.
- **Porcentaje medio visto:** proporción media del video que se vio.
- **Suscriptores ganados:** señal de que el tema y la propuesta invitaron a continuar con el canal.
- **Comentarios, compartidos y “me gusta”:** leer también su contenido y contexto, no solo contar reacciones.

### Videos largos
- Impresiones y CTR de impresiones: muestran cómo responden los espectadores a título/miniatura cuando se presentan.
- Duración media de visualización y retención: ayudan a detectar si el contenido cumple la promesa.
- Horas de reproducción públicas válidas y espectadores recurrentes.
- Suscriptores ganados por video.
- Fuentes de tráfico, cuando el informe tenga datos suficientes.

No comparar directamente un CTR de video largo con “vieron frente a deslizaron” de Shorts. Miden etapas distintas del recorrido.

## 3. Cadencia de medición

Registrar las métricas de cada publicación a:
- **24 horas:** primera lectura de distribución y reacción inicial.
- **7 días:** rendimiento acumulado más comparable.
- **28 días:** tendencia por tema, formato y serie, con muestra suficiente.

Los datos de YouTube pueden tardar en estabilizarse. Indicar fecha/hora de la captura, zona horaria y período analizado. Nunca completar métricas faltantes con estimaciones.

Usar `templates/seguimiento-publicaciones.csv` como registro maestro. Si un dato no está disponible, dejar la celda vacía.

## 4. Cómo hacer una prueba útil

1. Escribir una hipótesis concreta: “Un gancho que nombra el hecho confirmado hará que más personas se queden que una apertura genérica”.
2. Elegir la variable a probar: gancho, duración, encuadre visual, título, estructura o serie.
3. Mantener el resto lo más estable posible, dentro de lo razonable.
4. Comparar piezas con temas y condiciones similares.
5. Revisar la mediana y la dispersión de varias publicaciones, no solo el promedio de una pieza viral.
6. Guardar el resultado como “señal”, “inconcluso” o “apoyado por varias pruebas”.
7. Hacer un siguiente experimento. No cambiar cinco variables porque un video tuvo pocas vistas.

## 5. Diagnóstico de problemas

| Señal | Posible explicación | Prueba siguiente |
|---|---|---|
| El Short se muestra, pero muchos deslizan | El gancho o primer fotograma no comunica la historia | Empezar con protagonista y hecho, sin saludo |
| Eligen verlo, pero abandonan pronto | La narración se demora o no entrega lo prometido | Mostrar el dato principal antes y recortar introducción |
| Buena retención, pocas impresiones | El tema tiene alcance limitado, el sistema aún no encuentra audiencia o la muestra es pequeña | Publicar otra pieza útil del mismo pilar y revisar a 7 días |
| Buen CTR de video largo, baja duración media | Miniatura/título prometen algo que el video demora en entregar | Alinear el primer minuto con la promesa |
| Buen tiempo de reproducción, pocos suscriptores | No está claro qué valor tendrá la siguiente visita | Desarrollar una serie coherente y relacionar videos |
| Mucha reacción, comentarios con correcciones factuales | El contenido puede estar confundiendo o exagerando | Detener la fórmula, corregir y auditar las fuentes |
| Muchas vistas, pocas fuentes de ingreso | El formato todavía no conduce a una relación comercial útil | Construir videos largos, comunidad y una oferta pertinente sin saturar |

Estas son hipótesis para investigar, no diagnósticos automáticos ni garantías causales.

## 6. Indicadores de calidad y seguridad editorial

Revisar semanalmente:
- porcentaje de videos con fuente trazable;
- porcentaje de recursos audiovisuales con licencia o permiso documentado;
- número de correcciones factuales;
- reclamaciones o bloqueos por copyright;
- ejecuciones que renderizaron, publicaron y validaron la URL;
- fallos OAuth, errores del pipeline y cantidad de ejecuciones sin historia suficiente.

La meta operativa es que todas las publicaciones sean trazables y que no haya ningún recurso de terceros sin derechos documentados. No sacrificar estas métricas para obtener más volumen.

## 7. Revisión editorial de 30 minutos

1. Revisar las 3 publicaciones con mejor rendimiento relativo.
2. Revisar 3 con bajo rendimiento y localizar el punto de abandono.
3. Separar rendimiento por pilar: fútbol chileno, Colo-Colo, otros clubes chilenos, jugadores en el extranjero, internacional y análisis.
4. Identificar qué preguntas repite la audiencia.
5. Elegir una sola prueba para la semana siguiente.
6. Anotar qué no se puede concluir todavía.

## 8. Referencia oficial

[Entender el rendimiento del contenido en YouTube](https://support.google.com/youtube/answer/12220281) y [analíticas de Shorts](https://support.google.com/youtube/answer/12942217) documentan nombres y definiciones de métricas. Consultar estas páginas si Studio cambia su interfaz o nomenclatura.
