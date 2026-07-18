# 🔧 FASE 1: Guía de Implementación - Fix YouTube OAuth Token

## Resumen de cambios

He creado 2 archivos mejorados en la rama `fix/youtube-oauth-token`:

### 1. **upload-youtube.js** (CRÍTICO)
**Problema:** Error `invalid_grant` al intentar renovar el refresh token de YouTube
**Solución:** 
- Validación explícita de errores OAuth2
- Reintentos automáticos con exponential backoff (3 intentos)
- Detecta permanentemente si el token está revocado/expirado
- Mejor logging para debugging

### 2. **render-and-upload.js** (ROBUSTO)
**Problema:** Si un video falla en renderizado, todo el pipeline se detiene
**Solución:**
- Continúa procesando aunque un video falle
- Registra qué videos fallaron y por qué
- Output claro para GitHub Actions
- Manifest JSON con estadísticas finales

---

## ⚠️ PROBLEMA: invalid_grant

Este error significa que el **YOUTUBE_REFRESH_TOKEN** en GitHub Secrets es inválido o expirado.

### Causas comunes:
1. ❌ El token nunca se regeneró después de ser revocado
2. ❌ Pasaron más de 6 meses sin usar el token (Google lo revoca automáticamente)
3. ❌ El usuario revocó manualmente el acceso en Google Account
4. ❌ Se usó el token en múltiples máquinas simultáneamente

### Cómo regenerar un REFRESH_TOKEN válido:

```bash
# 1. Instala google-auth-library localmente
npm install google-auth-library

# 2. Crea este script temporal: get-refresh-token.js
```

```javascript
// get-refresh-token.js
const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const open = require('open');

const oauth2Client = new google.auth.OAuth2(
  'TU_YOUTUBE_CLIENT_ID',          // ← Reemplaza
  'TU_YOUTUBE_CLIENT_SECRET',      // ← Reemplaza
  'http://localhost:3000/oauth2callback'
);

const scopes = ['https://www.googleapis.com/auth/youtube.upload'];

const server = http.createServer(async (req, res) => {
  if (req.url.indexOf('/oauth2callback') > -1) {
    const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
    const code = qs.get('code');
    
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n✅ REFRESH_TOKEN (cópialo a GitHub Secrets):');
    console.log(tokens.refresh_token);
    
    res.end('Token generado! Puedes cerrar esta ventana.');
    server.close();
  }
});

server.listen(3000, () => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  console.log('Abre esta URL en tu navegador:');
  console.log(authUrl);
});
```

```bash
# 3. Ejecuta desde tu computadora
node get-refresh-token.js

# 4. Se abrirá tu navegador, autoriza la app
# 5. Copia el REFRESH_TOKEN que aparecerá en la consola
# 6. Actualiza GitHub Secrets
```

---

## 📋 Cómo actualizar GitHub Secrets

1. Ve a: `https://github.com/sinnick31/mundial2026-tv/settings/secrets/actions`
2. Haz clic en **"New repository secret"**
3. Nombre: `YOUTUBE_REFRESH_TOKEN`
4. Valor: Pega el token regenerado
5. Click **"Add secret"**

---

## ✅ Qué hace la nueva versión

### upload-youtube.js v4.1

```javascript
// ANTES (❌ Falló):
function getAccessToken() {
  // Solo intenta una vez
  // Si falla, se cuelga
}

// AHORA (✅ Funciona):
async function getAccessTokenWithRetry() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await getAccessToken(attempt);
    } catch (err) {
      // Detecta invalid_grant → error permanente
      if (err.oauth_error === "invalid_grant") {
        console.error("🔴 ERROR CRÍTICO: Token expirado/revocado");
        console.error("Solución: Regenera el token en Google Cloud Console");
        process.exit(1);
      }
      
      // Otros errores → reintenta con backoff
      if (attempt < MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        await sleep(delay);
      }
    }
  }
}
```

### render-and-upload.js v4.1

```javascript
// ANTES (❌ Pipeline bloqueado):
for (const item of contenido) {
  renderVideo(...);     // Si falla → ERROR FATAL
  uploadToYouTube(...); // Nunca llega aquí
}

// AHORA (✅ Continúa siempre):
for (const item of contenido) {
  try {
    renderVideo(...);     // Si falla → registra y continúa
    uploadToYouTube(...); // Si falla → registra y continúa
  } catch (err) {
    manifest.videos.push({
      gancho: item.gancho,
      status: "upload_failed",
      error: err.message
    });
    // ✅ Continúa con el siguiente video
  }
}

// Resultado: manifest.json con estadísticas
{
  "exitosos": 3,
  "fallidos": 1,
  "videos": [...]
}
```

---

## 🚀 Próximos pasos

### Fase 2 (después de merguear este PR):
- [ ] Añadir motor de tendencias (Google Trends, YouTube Trends)
- [ ] Mejorar generación de guiones sin repetir contenido
- [ ] Optimizar renderizado (caché de componentes)

### Fase 3 (monetización):
- [ ] Integrar gestor de afiliados (JSON con comisiones)
- [ ] Seleccionar automáticamente enlaces según contenido
- [ ] Registrar rendimiento de cada afiliado

### Fase 4 (dashboard):
- [ ] Panel web con métricas de ingresos
- [ ] Gráficos por día/semana/mes
- [ ] Historial de videos publicados

---

## 📊 Cambios en el repositorio

```bash
# Rama actual
git branch
* fix/youtube-oauth-token

# Commits creados:
# 1. fix: corregir flujo OAuth2 invalid_grant y añadir reintentos
# 2. feat: crear render-and-upload mejorado con manejo robusto de errores

# Para merguear a main:
git checkout main
git pull
git merge fix/youtube-oauth-token
git push
```

---

## ❓ Preguntas frecuentes

**P: ¿Cuándo se revoca automáticamente un REFRESH_TOKEN?**
R: Después de 6 meses sin usarlo, o si se autoriza la app en otra máquina.

**P: ¿Por qué 3 reintentos máximo?**
R: YouTube rate-limit: máx 100 requests/segundo. Con 3 reintentos, cubrimos errores temporales sin abusar.

**P: ¿Qué pasa si falla el renderizado de 1 video?**
R: Los otros 3-4 videos se renderizarán y subirán igual. Se registra en el manifest.

**P: ¿Dónde veo qué videos fallaron?**
R: En el output de GitHub Actions, y en `/tmp/rendered-manifest.json`

---

## 📞 Support

Si después de regenerar el token sigue fallando:

1. Verifica que `YOUTUBE_CLIENT_ID` y `YOUTUBE_CLIENT_SECRET` sean correctos
2. Verifica que la app esté en production en Google Cloud Console (no en test)
3. Revisa los logs de GitHub Actions: Settings → Actions → Último run

