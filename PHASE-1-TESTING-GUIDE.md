# 🧪 TESTING GUIDE - Phase 1 Branch

## 📌 Objetivo

Validar que los cambios en `upload-youtube.js` y `render-and-upload.js` funcionen correctamente sin romper el pipeline existente.

---

## ✅ Pre-requisitos

Antes de hacer testing, asegúrate de tener:

```bash
# 1. Clonar/actualizar el repo
git clone https://github.com/sinnick31/mundial2026-tv.git
cd mundial2026-tv

# 2. Checkouteá la rama
git checkout fix/youtube-oauth-token

# 3. Verifica que estés en la rama correcta
git branch
# * fix/youtube-oauth-token
#   main
```

---

## 🔧 Test 1: Verificación de sintaxis

```bash
# Instala las dependencias
npm install

# Verifica que no haya errores de sintaxis
npm run lint

# Compila TypeScript
tsc --noEmit
```

**Resultado esperado:** ✅ Sin errores

---

## 🔍 Test 2: Análisis de código

### upload-youtube.js cambios:

```bash
# Compara con la versión anterior
git diff main..fix/youtube-oauth-token -- scripts/upload-youtube.js | head -100
```

**Qué buscar:**
- ✅ `getAccessTokenWithRetry()` con reintentos
- ✅ Detección de `oauth_error === "invalid_grant"`
- ✅ Exponential backoff (1s, 2s, 4s)
- ✅ Mejor logging

### render-and-upload.js cambios:

```bash
git diff main..fix/youtube-oauth-token -- scripts/render-and-upload.js | head -100
```

**Qué buscar:**
- ✅ Try-catch envolviendo cada video
- ✅ Loop continúa aunque falle un video
- ✅ Manifest JSON guardado con estadísticas
- ✅ GitHub Actions outputs

---

## 🧪 Test 3: Prueba local (simulada)

### 3a. Simular fallo de renderizado

```javascript
// test-render-fail.js (crear archivo temporal)
const fs = require('fs');

// Simular daily-content.json con 2 videos
const mock = {
  fecha: '2026-07-18',
  total: 2,
  contenido: [
    {
      _orden: 1,
      _tipo_contenido: 'narrativa',
      gancho: 'TEST VIDEO 1',
      equipo1: 'Argentina',
      equipo2: 'Brasil'
    },
    {
      _orden: 2,
      _tipo_contenido: 'prediccion',
      gancho: 'TEST VIDEO 2',
      equipo1: 'Chile',
      equipo2: 'Uruguay'
    }
  ]
};

fs.writeFileSync('daily-content.json', JSON.stringify(mock, null, 2));
console.log('✅ Mock daily-content.json creado');
```

```bash
node test-render-fail.js
# ✅ Mock daily-content.json creado
```

### 3b. Simular fallo OAuth

```javascript
// test-oauth-retry.js
const https = require('https');

// Mock de respuesta con error
const mockError = {
  error: 'invalid_grant',
  error_description: 'Token has been revoked.'
};

console.log('Mock de respuesta OAuth:');
console.log(JSON.stringify(mockError, null, 2));
console.log('\n✅ Esto ahora es detectado por upload-youtube.js v4.1');
```

```bash
node test-oauth-retry.js
```

---

## 🚀 Test 4: GitHub Actions Workflow (recomendado)

### Opción A: Ejecutar manualmente desde GitHub UI

1. Ve a: https://github.com/sinnick31/mundial2026-tv/actions
2. Selecciona: **"⚽ FOOTBALL AI STUDIO v4.0 — Pipeline 365 días"**
3. Click en **"Run workflow"**
4. Selecta:
   - **Branch:** `fix/youtube-oauth-token`
   - **max_items:** 1 (para prueba rápida)
   - **modo:** `noticias` (el más rápido)
5. Click **"Run workflow"**

### Opción B: Trigger local con GitHub CLI

```bash
# Instala GitHub CLI si no lo tienes
brew install gh  # macOS
# o: choco install gh  # Windows
# o: sudo apt install gh  # Linux

# Autentica
gh auth login

# Ejecuta el workflow en la rama
gh workflow run futbol-pipeline.yml \
  -f max_items=1 \
  -f modo=noticias \
  -r fix/youtube-oauth-token
```

---

## 📊 Test 5: Verificar los logs

Una vez que el workflow corra, revisa los logs:

### 5a. Buscar la sección de upload-youtube

```
🔑 Obteniendo access token...
✅ Access token obtenido (intento 1)
🚀 Iniciando upload...
✅ URL resumable creada
📤 Subiendo video...
✅ ¡Subido exitosamente!
```

**Si ves esto:** ✅ El token es válido

**Si ves esto:**
```
❌ Intento 1/3 falló: OAuth error: invalid_grant
🔴 ERROR CRÍTICO: invalid_grant
Token expirado/revocado — regenera el token
```

**Significa:** ⚠️ Debes regenerar el REFRESH_TOKEN (sigue FASE-1-IMPLEMENTATION-GUIDE.md)

### 5b. Buscar la sección de render-and-upload

```
📊 Renderizando 1 video(s)...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[1/1] narrativa — NOTICIA DE HOY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬 [1/1] Renderizando: PrediccionIA
✅ Renderizado exitoso: NOTICIA_DE_HOY_1234567890.mp4
📤 Subiendo a YouTube: NOTICIA_DE_HOY_1234567890.mp4
✅ Subida exitosa a YouTube

════════════════════════════════════════
📊 RESUMEN FINAL
════════════════════════════════════════
✅ Exitosos: 1
❌ Fallidos: 0
📊 Total: 1
════════════════════════════════════════
```

---

## ❌ Troubleshooting

### Caso 1: "invalid_grant" en GitHub Actions

```
❌ Error fatal: OAuth error: invalid_grant
```

**Solución:**
1. Abre https://github.com/sinnick31/mundial2026-tv/settings/secrets/actions
2. Regenera `YOUTUBE_REFRESH_TOKEN` (sigue guía en FASE-1-IMPLEMENTATION-GUIDE.md)
3. Re-ejecuta el workflow

### Caso 2: "Timeout renderizando"

```
❌ Fallo renderizando PrediccionIA: Timeout after 600000ms
```

**Causas:**
- Remotion tardó más de 10 minutos
- Chrome no se inició correctamente

**Solución:**
- Reintenta en 30 minutos
- Si persiste, aumenta timeout en `render-and-upload.js` línea 68

### Caso 3: "daily-content.json no existe"

```
⏳ daily-content.json no existe — nada que renderizar.
```

**Esto es NORMAL** si:
- `generate-daily-content.js` no encontró contenido viral
- `fetch-news.js` falla

**Solución:**
- Ejecuta el workflow en modo `noticias` (más garantizado)
- Revisa logs de `fetch-news.js`

---

## 📋 Checklist de validación

- [ ] `npm run lint` sin errores
- [ ] `git diff` muestra solo cambios esperados
- [ ] Workflow ejecutado en GitHub Actions
- [ ] Token OAuth válido (no `invalid_grant`)
- [ ] Si un video falla, el pipeline continúa
- [ ] Manifest JSON se genera con estadísticas
- [ ] Al menos 1 video se sube exitosamente

---

## ✅ Cuando estés listo para mergear

```bash
# 1. Verifica que estés en la rama
git branch

# 2. Verifica los commits
git log main..fix/youtube-oauth-token --oneline
# Deberías ver 3 commits

# 3. Mergea a main
git checkout main
git pull
git merge fix/youtube-oauth-token

# 4. Pushea
git push
```

---

## 📞 Preguntas?

Si algo no funciona o tienes dudas, revisa:
1. `FASE-1-IMPLEMENTATION-GUIDE.md` — para configuración
2. Este archivo — para testing
3. GitHub Actions logs — para debugging

