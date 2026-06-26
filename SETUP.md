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

### Paso B — Obtener Refresh Token (una sola vez)
```bash
# Instalar google-auth-library
npm install -g google-auth-library

# Ejecutar este script en tu PC para autorizar tu canal
node -e "
const { OAuth2Client } = require('google-auth-library');
const http = require('http');
const url = require('url');

const CLIENT_ID = 'TU_CLIENT_ID';
const CLIENT_SECRET = 'TU_CLIENT_SECRET';
const REDIRECT = 'http://localhost:3000/callback';

const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT);
const authUrl = client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/youtube.upload'],
});

console.log('Abre esta URL en tu navegador:\n' + authUrl);

// Servidor temporal para capturar el código
const server = http.createServer(async (req, res) => {
  const q = url.parse(req.url, true);
  if (q.pathname === '/callback') {
    const { tokens } = await client.getToken(q.query.code);
    console.log('\n✅ REFRESH TOKEN:', tokens.refresh_token);
    console.log('Guárdalo en GitHub Secrets como YOUTUBE_REFRESH_TOKEN');
    res.end('Token obtenido! Cierra esta ventana.');
    server.close();
  }
});
server.listen(3000, () => console.log('Esperando callback en http://localhost:3000...'));
"
```

---

## 4️⃣ Agregar Secrets en GitHub

Ve a tu repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Valor |
|---|---|
| `FOOTBALL_DATA_API_KEY` | Tu API key de football-data.org |
| `YOUTUBE_CLIENT_ID` | OAuth2 Client ID de Google Cloud |
| `YOUTUBE_CLIENT_SECRET` | OAuth2 Client Secret de Google Cloud |
| `YOUTUBE_REFRESH_TOKEN` | El refresh token obtenido en el Paso B |
| `COMPETITION_ID` | `WC` (FIFA World Cup — confirmar ID cuando empiece) |

---

## 5️⃣ Verificar el workflow

```bash
# Disparar manualmente con un partido de prueba
# En GitHub → Actions → ⚽ Mundial 2026 — Auto Shorts → Run workflow
# Pegar en "force_match":
{
  "homeTeam": "BRASIL",
  "awayTeam": "ARGENTINA",
  "homeScore": 2,
  "awayScore": 1,
  "homeFlag": "🇧🇷",
  "awayFlag": "🇦🇷",
  "homeColor": "#009c3b",
  "awayColor": "#74acdf",
  "matchDate": "25 JUN 2026",
  "matchStage": "GRUPO A · JORNADA 1",
  "venue": "AT&T Stadium",
  "city": "Dallas, Texas"
}
```

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
