# ⚙️ SETUP GUIDE — MUNDIAL 2026 TV Automation

Guía paso a paso para configurar la automatización gratuita con GitHub Actions.

---

## 1️⃣ Crear repositorio en GitHub

```bash
# En tu máquina local
cd mundial2026-shorts
git init
git add .
git commit -m "feat: MUNDIAL 2026 TV — ResultadoShorts automation"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/mundial2026-tv.git
git push -u origin main
```

---

## 2️⃣ Obtener API Key de football-data.org (GRATIS)

1. Ir a → https://www.football-data.org/client/register
2. Registrarse con tu email
3. Copiar el **API Token** que te envían por email
4. Plan gratuito: ✅ 10 requests/min, acceso a todos los mundiales

---

## 3️⃣ Obtener credenciales YouTube OAuth2

### Paso A — Google Cloud Console
1. Ir a → https://console.cloud.google.com/
2. Crear proyecto nuevo: `mundial2026-tv`
3. Activar **YouTube Data API v3**
4. Ir a → Credenciales → Crear credenciales → **OAuth 2.0 Client IDs**
5. Tipo: **Desktop Application**
6. Descargar `client_secret.json`

### Paso B — Autorizar el canal y renovar el refresh token

Usa el JSON del mismo cliente OAuth de escritorio que corresponde a `YOUTUBE_CLIENT_ID` y `YOUTUBE_CLIENT_SECRET` en GitHub Actions. Si estás configurando los secretos por primera vez o cambiaste de cliente, registra ambos valores en GitHub como indica el paso 4 antes de continuar. Guarda el JSON fuera del repositorio.

En tu equipo, instala [GitHub CLI](https://cli.github.com/) e inicia sesión con una cuenta que pueda administrar los secretos del repositorio. Desde la raíz del proyecto, ejecuta:

```bash
gh auth login
npm ci
node scripts/renew-youtube-refresh-token.js "RUTA_AL_JSON_DE_GOOGLE"
```

Abre la URL que muestra el script, elige el canal FÚTBOL CHILENSIS y concede los permisos de lectura y subida. El script comprueba que Google acepta el nuevo refresh token y que la autorización corresponde al canal esperado. Después actualiza `YOUTUBE_REFRESH_TOKEN` directamente en GitHub Actions.

Si la aplicación OAuth es **External** y está en **Testing**, Google emite refresh tokens de YouTube que caducan a los siete días. Revisa el estado de publicación de la aplicación en Google Cloud antes de emitir un reemplazo si necesitas una autorización duradera. [Documentación de Google](https://developers.google.com/identity/protocols/oauth2#expiration).

---

## 4️⃣ Agregar Secrets en GitHub

Ve a tu repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Valor |
|---|---|
| `FOOTBALL_DATA_API_KEY` | Tu API key de football-data.org |
| `YOUTUBE_CLIENT_ID` | OAuth2 Client ID de Google Cloud |
| `YOUTUBE_CLIENT_SECRET` | OAuth2 Client Secret de Google Cloud |
| `YOUTUBE_REFRESH_TOKEN` | Actualizado por el script del Paso B |
| `COMPETITION_ID` | `WC` (FIFA World Cup — confirmar ID cuando empiece) |

---

## 5️⃣ Verificar las credenciales en GitHub Actions

**Validar YouTube OAuth** ejecuta una comprobación diaria en `main`. También puedes iniciarla desde la pestaña **Actions** después de renovar el secreto. El workflow canjea el refresh token configurado por un access token y verifica el canal autorizado, sin renderizar ni publicar videos.

Al publicar, el cliente OAuth obtiene automáticamente el access token a partir del refresh token guardado. Si Google rechaza el refresh token con `INVALID_REFRESH_TOKEN`, vuelve a autorizar el canal como indica el paso B.

---

## 6️⃣ Cronograma automático

El workflow corre automáticamente:

| Hora UTC | Hora Chile | Cuándo |
|---|---|---|
| 12:30 | 08:30 | Después de partidos de madrugada |
| 15:30 | 11:30 | Después de partidos de mañana |
| 17:30 | 13:30 | Cobertura de partidos tarde |
| 19:30 | 15:30 | Después de partidos de tarde |
| 22:30 | 18:30 | Después de partidos de noche |
| 01:30 | 21:30 | Partidos nocturnos tardíos |
| 03:00 | 23:00 | Partidos de madrugada USA |

---

## 💰 ¿Cuánto cuesta?

| Servicio | Costo |
|---|---|
| GitHub Actions | **GRATIS** (2000 min/mes) |
| football-data.org | **GRATIS** (plan básico) |
| YouTube Data API v3 | **GRATIS** (10.000 unidades/día) |
| **TOTAL** | **$0 / mes** ✅ |

Estimado de uso: cada render Remotion toma ~5-10 min = ~64 partidos/mes bien dentro del límite.

---

## 🎥 Flujo completo

```
[Cron cada 30min]
      ↓
[football-data.org API] → ¿Partido terminado?
      ↓ SÍ
[GitHub Actions Runner]
      ↓
[Remotion render] → ResultadoShorts.mp4 (1080×1920)
      ↓
[YouTube Data API v3] → YouTube Shorts publicado
      ↓
[Notificación en GitHub Actions log]
```

---

## 🆘 Troubleshooting

**Error: FOOTBALL_DATA_API_KEY inválida**
→ Verificar que copiaste correctamente el token de football-data.org

**Error: Chrome no disponible**
→ GitHub Actions instala Chrome automáticamente con `npx remotion browser ensure`

**Error: YouTube 403 Forbidden**
→ Verificar que YouTube Data API v3 está activada en Google Cloud Console

**Competition ID incorrecto**
→ Cuando empiece el Mundial 2026, verificar el ID en:
   `https://api.football-data.org/v4/competitions`
