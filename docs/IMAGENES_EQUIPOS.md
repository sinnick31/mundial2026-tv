# Imágenes de equipos en los Shorts

La plantilla admite una fotografía contextual por equipo, pero **solo la muestra si la URL está declarada con `rights: "authorized"`**. No se descargan ni reutilizan automáticamente fotos de noticias, transmisiones, Google Imágenes o redes sociales, porque su presencia pública no significa que estén libres de derechos.

## Configurar el secreto de GitHub

En el repositorio, abre **Settings → Secrets and variables → Actions → New repository secret**.

- **Name:** `TEAM_IMAGES_JSON`
- **Value:** un objeto JSON con el nombre de equipo, una URL HTTPS directa a la imagen y el crédito. Usa únicamente imágenes propias, licenciadas para reutilización o cuyo permiso tengas confirmado.

Ejemplo de estructura (reemplaza la URL y el crédito por datos reales autorizados):

```json
{
  "Colo-Colo": {
    "url": "https://TU-DOMINIO/imagen-con-permiso.jpg",
    "credit": "Nombre del fotógrafo o titular",
    "rights": "authorized"
  },
  "Universidad de Chile": {
    "url": "https://TU-DOMINIO/imagen-con-permiso.jpg",
    "credit": "Nombre del fotógrafo o titular",
    "rights": "authorized"
  }
}
```

La URL debe ser accesible desde GitHub Actions sin iniciar sesión y entregar directamente un archivo de imagen. No pegues tokens privados ni claves dentro de este JSON. Si el secreto no existe, está mal formado o los derechos no están marcados como autorizados, el video se genera sin foto de equipo.

## Comprobación editorial

- Verifica que la foto corresponda al equipo mencionado y no a un rival.
- Confirma el permiso/licencia y conserva el comprobante.
- El crédito que se muestra en pantalla debe identificar correctamente al titular o fotógrafo.
- La fecha mostrada por el canal es la fecha de publicación de la fuente; no debe presentarse como fecha del partido.
- Antes de publicar, revisa manualmente el video renderizado, la noticia y la atribución. La automatización no reemplaza esa revisión.
