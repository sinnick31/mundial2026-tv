# Utils

Este directorio contiene utilidades compartidas entre los diferentes scripts del proyecto.

## teamData.js

Contiene datos y funciones reutilizables relacionadas con equipos, países y configuraciones del Mundial 2026.

### Constantes

- `TEAM_FLAGS`: Mapeo de nombres de equipos a sus banderas emoji
- `TEAM_COLORS`: Mapeo de nombres de equipos a sus colores primarios (formato hex)
- `STAGE_MAP`: Mapeo de etapas del torneo a su representación en español
- `VENUE_MAP`: Mapeo de estadios a sus ciudades

### Funciones

- `formatDate(isoDate)`: Formatea una fecha ISO a formato DD MMM YYYY (ej: "25 JUN 2026")
- `formatStage(match)`: Formatea la etapa del partido para mostrar (incluye grupo y jornada para fase de grupos)
- `getTeamFlag(teamName)`: Obtiene la bandera de un equipo
- `getTeamColor(teamName)`: Obtiene el color de un equipo
- `getCityFromVenue(venue)`: Obtiene la ciudad correspondiente a un venue

### Uso

```javascript
const { TEAM_FLAGS, TEAM_COLORS, STAGE_MAP, VENUE_MAP, formatDate, formatStage, getTeamFlag, getTeamColor, getCityFromVenue } = require("./utils/teamData");

// Ejemplo de uso
const flag = getTeamFlag("Brazil"); // 🇧🇷
const color = getTeamColor("Argentina"); // #74acdf
const formattedDate = formatDate("2026-06-25T15:00:00Z"); // 25 JUN 2026
```