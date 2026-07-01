/**
 * teamData.js
 * ─────────────────────────────────────────────────────────────────────────
 * Datos compartidos de equipos para todo el proyecto
 * Contiene banderas, colores y mapeos de etapas
 */

// Mapeo de banderas de equipos
const TEAM_FLAGS = {
  "Brazil": "🇧🇷", "Argentina": "🇦🇷", "France": "🇫🇷", "Germany": "🇩🇪",
  "Spain": "🇪🇸", "Portugal": "🇵🇹", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Netherlands": "🇳🇱",
  "Belgium": "🇧🇪", "Uruguay": "🇺🇾", "Colombia": "🇨🇴", "Mexico": "🇲🇽",
  "United States": "🇺🇸", "USA": "🇺🇸", "Chile": "🇨🇱", "Ecuador": "🇪🇨",
  "Peru": "🇵🇪", "Japan": "🇯🇵", "South Korea": "🇰🇷", "Australia": "🇦🇺",
  "Morocco": "🇲🇦", "Senegal": "🇸🇳", "Ghana": "🇬🇭", "Nigeria": "🇳🇬",
  "Canada": "🇨🇦", "Saudi Arabia": "🇸🇦", "Iran": "🇮🇷", "Poland": "🇵🇱",
  "Croatia": "🇭🇷", "Serbia": "🇷🇸", "Switzerland": "🇨🇭", "Denmark": "🇩🇰",
  "Austria": "🇦🇹", "Turkey": "🇹🇷", "Ukraine": "🇺🇦", "Hungary": "🇭🇺",
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "Italy": "🇮🇹", "Sweden": "🇸🇪",
  "Costa Rica": "🇨🇷", "Panama": "🇵🇦", "Honduras": "🇭🇳", "Jamaica": "🇯🇲",
  "Algeria": "🇩🇿", "Tunisia": "🇹🇳", "Cameroon": "🇨🇲", "Egypt": "🇪🇬",
  "Qatar": "🇶🇦", "Iraq": "🇮🇶", "Uzbekistan": "🇺🇿", "Indonesia": "🇮🇩",
  "Venezuela": "🇻🇪", "Bolivia": "🇧🇴", "Paraguay": "🇵🇾",
};

// Mapeo de colores de equipos
const TEAM_COLORS = {
  "Brazil": "#009c3b", "Argentina": "#74acdf", "France": "#002395",
  "Germany": "#1d1d1d", "Spain": "#AA151B", "Portugal": "#006600",
  "England": "#ffffff", "Netherlands": "#FF6600", "Belgium": "#EF3340",
  "Uruguay": "#5EB6E4", "Colombia": "#FCD116", "Mexico": "#006847",
  "United States": "#002868", "USA": "#002868", "Chile": "#D52B1E",
  "Ecuador": "#FFD100", "Peru": "#D91023", "Japan": "#003087",
  "South Korea": "#003478", "Australia": "#00843D", "Morocco": "#C1272D",
  "Senegal": "#00853F", "Ghana": "#006B3F", "Nigeria": "#008751",
  "Canada": "#FF0000", "Saudi Arabia": "#006C35", "Iran": "#239F40",
  "Poland": "#DC143C", "Croatia": "#FF0000", "Serbia": "#C6363C",
  "Switzerland": "#FF0000", "Denmark": "#C60C30", "Austria": "#ED2939",
  "Turkey": "#E30A17", "Ukraine": "#005BBB", "Costa Rica": "#002B7F",
  "Venezuela": "#CF142B", "Bolivia": "#D52B1E", "Paraguay": "#D52B1E",
  "Algeria": "#006233", "Tunisia": "#E70013", "Cameroon": "#007A5E",
};

// Mapeo de etapas del torneo
const STAGE_MAP = {
  "GROUP_STAGE": "FASE DE GRUPOS",
  "LAST_16": "OCTAVOS DE FINAL",
  "QUARTER_FINALS": "CUARTOS DE FINAL",
  "SEMI_FINALS": "SEMIFINAL",
  "THIRD_PLACE": "TERCER PUESTO",
  "FINAL": "FINAL",
};

// Mapeo de venues a ciudades
const VENUE_MAP = {
  "AT&T Stadium": "Dallas, Texas",
  "SoFi Stadium": "Los Ángeles, California",
  "MetLife Stadium": "Nueva York / Nueva Jersey",
  "Levi's Stadium": "San Francisco, California",
  "Arrowhead Stadium": "Kansas City, Missouri",
  "Lincoln Financial Field": "Filadelfia, Pennsylvania",
  "Empower Field at Mile High": "Denver, Colorado",
  "Hard Rock Stadium": "Miami, Florida",
  "Gillette Stadium": "Boston, Massachusetts",
  "NRG Stadium": "Houston, Texas",
  "Lumen Field": "Seattle, Washington",
  "Estadio Azteca": "Ciudad de México",
  "Estadio Guadalajara": "Guadalajara, Jalisco",
  "Estadio BBVA": "Monterrey, Nuevo León",
  "BC Place": "Vancouver, Canadá",
  "BMO Field": "Toronto, Canadá",
};

/**
 * Formatea una fecha ISO a formato DD MMM YYYY
 * @param {string} isoDate - Fecha en formato ISO
 * @returns {string} Fecha formateada (ej: "25 JUN 2026")
 */
function formatDate(isoDate) {
  const date = new Date(isoDate);
  const months = [
    "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
    "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
  ];
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * Formatea la etapa del partido para mostrar
 * @param {Object} match - Objeto de partido de la API
 * @returns {string} Etapa formateada
 */
function formatStage(match) {
  const stage = STAGE_MAP[match.stage] || match.stage;
  if (match.stage === "GROUP_STAGE" && match.group) {
    const groupLetter = match.group.replace("GROUP_", "");
    // Calcular jornada (matchday)
    const jornada = match.matchday || 1;
    return `GRUPO ${groupLetter} · JORNADA ${jornada}`;
  }
  return stage;
}

/**
 * Obtiene la bandera de un equipo
 * @param {string} teamName - Nombre del equipo
 * @returns {string} Emoji de la bandera
 */
function getTeamFlag(teamName) {
  return TEAM_FLAGS[teamName] || "🏳️";
}

/**
 * Obtiene el color de un equipo
 * @param {string} teamName - Nombre del equipo
 * @returns {string} Color en formato hex
 */
function getTeamColor(teamName) {
  return TEAM_COLORS[teamName] || "#ffffff";
}

/**
 * Obtiene la ciudad correspondiente a un venue
 * @param {string} venue - Nombre del estadio
 * @returns {string} Ciudad y estado/país
 */
function getCityFromVenue(venue) {
  return VENUE_MAP[venue] || "USA / CAN / MEX";
}

module.exports = {
  TEAM_FLAGS,
  TEAM_COLORS,
  STAGE_MAP,
  VENUE_MAP,
  formatDate,
  formatStage,
  getTeamFlag,
  getTeamColor,
  getCityFromVenue,
};