/**
 * config/ligas.js — FOOTBALL AI STUDIO v4.0
 *
 * Configuración central de TODO el ecosistema de fútbol que cubre el canal.
 * Reemplaza el enfoque exclusivo "Mundial 2026" por cobertura 365 días al año.
 *
 * IMPORTANTE — football-data.org (plan gratis) NO incluye la liga chilena.
 * El fútbol chileno se cubre vía noticias RSS (Google News), que funciona
 * excelente para Chile. Los partidos con datos estructurados vienen de las
 * competiciones internacionales del plan gratis.
 */

// ─── Competiciones con datos estructurados (football-data.org, plan gratis) ──
// Se consultan TODAS en una sola llamada: /v4/matches?competitions=...
const COMPETICIONES_API = {
  2001: { nombre: 'Champions League', hashtag: '#ChampionsLeague', prioridad: 10 },
  2021: { nombre: 'Premier League', hashtag: '#PremierLeague', prioridad: 9 },
  2014: { nombre: 'LaLiga', hashtag: '#LaLiga', prioridad: 9 },
  2019: { nombre: 'Serie A', hashtag: '#SerieA', prioridad: 7 },
  2002: { nombre: 'Bundesliga', hashtag: '#Bundesliga', prioridad: 7 },
  2015: { nombre: 'Ligue 1', hashtag: '#Ligue1', prioridad: 6 },
  2152: { nombre: 'Copa Libertadores', hashtag: '#Libertadores', prioridad: 10 },
  2013: { nombre: 'Brasileirão', hashtag: '#Brasileirao', prioridad: 5 },
  2000: { nombre: 'Mundial FIFA', hashtag: '#Mundial2026', prioridad: 10 },
  2018: { nombre: 'Eurocopa', hashtag: '#Eurocopa', prioridad: 8 },
};

// Standings: 1 llamada extra por día, rotando por día de la semana
// (respeta el límite de 10 llamadas/minuto del plan gratis)
const ROTACION_TABLA = [2021, 2014, 2001, 2019, 2002, 2152, 2021]; // dom..sáb

// ─── FÚTBOL CHILENO — PRIORIDAD ALTA ─────────────────────────────────────────
const CHILE = {
  competiciones: [
    'Primera División', 'Campeonato Nacional', 'Liga de Primera',
    'Primera B', 'Copa Chile', 'Supercopa de Chile',
    'Selección Chilena', 'La Roja',
  ],
  equiposPrimeraA: [
    'Colo-Colo', 'Universidad de Chile', 'Universidad Católica', 'Palestino',
    'Audax Italiano', 'Unión Española', "O'Higgins", 'Cobresal', 'Everton',
    'Huachipato', 'Coquimbo Unido', 'Deportes Iquique', 'Ñublense',
    'Unión La Calera', 'Deportes Limache', 'Deportes La Serena',
  ],
  equiposPrimeraB: [
    'Santiago Wanderers', 'Cobreloa', 'Deportes Copiapó', 'San Marcos de Arica',
    'Rangers', 'Curicó Unido', 'Magallanes', 'Deportes Antofagasta',
    'Universidad de Concepción', 'Recoleta', 'San Luis', 'Santa Cruz',
    'Santiago Morning', 'Deportes Concepción', 'Deportes Temuco', 'Unión San Felipe',
  ],
  // Alias para detectar equipos en titulares (minúsculas, sin tildes)
  alias: {
    'colo colo': 'Colo-Colo', 'colocolo': 'Colo-Colo', 'cacique': 'Colo-Colo', 'albos': 'Colo-Colo',
    'u de chile': 'Universidad de Chile', 'universidad de chile': 'Universidad de Chile', 'la u': 'Universidad de Chile', 'azules': 'Universidad de Chile',
    'universidad catolica': 'Universidad Católica', 'la uc': 'Universidad Católica', 'cruzados': 'Universidad Católica', 'catolica': 'Universidad Católica',
    'la roja': 'Selección Chilena', 'seleccion chilena': 'Selección Chilena',
    'coquimbo': 'Coquimbo Unido', 'wanderers': 'Santiago Wanderers',
    'nublense': 'Ñublense', 'ohiggins': "O'Higgins", 'o higgins': "O'Higgins",
  },
};

// ─── Categorías de contenido (definen el mix editorial del canal) ────────────
// keywords en minúsculas y sin tildes — se comparan contra texto normalizado
const CATEGORIAS = {
  chile: {
    emoji: '🇨🇱',
    prioridadBase: 30, // bonus fuerte: es la ventaja competitiva del canal
    keywords: [
      'colo colo', 'colocolo', 'u de chile', 'universidad de chile',
      'universidad catolica', 'la roja', 'seleccion chilena', 'primera b',
      'copa chile', 'campeonato nacional', 'futbol chileno', 'liga de primera',
      ...CHILE.equiposPrimeraA.map((e) => e.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')),
      ...CHILE.equiposPrimeraB.map((e) => e.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')),
    ],
  },
  fichajes: {
    emoji: '💰',
    prioridadBase: 20,
    keywords: [
      'fichaje', 'fichajes', 'traspaso', 'transfer', 'refuerzo', 'renovacion',
      'contrato', 'clausula', 'mercado de pases', 'mercado de fichajes',
      'oficial', 'acuerdo', 'millones de euros', 'cedido', 'prestamo',
    ],
  },
  internacional: {
    emoji: '🌍',
    prioridadBase: 10,
    keywords: [
      'champions', 'premier league', 'laliga', 'la liga', 'serie a', 'bundesliga',
      'ligue 1', 'libertadores', 'sudamericana', 'eliminatorias', 'conmebol',
      'uefa', 'fifa', 'balon de oro', 'mundial de clubes', 'copa america', 'eurocopa',
      'real madrid', 'barcelona', 'manchester city', 'liverpool', 'arsenal',
      'bayern', 'psg', 'inter', 'milan', 'juventus', 'boca', 'river',
      'messi', 'mbappe', 'haaland', 'bellingham', 'vinicius', 'lamine yamal',
      'alexis sanchez', 'ben brereton', 'dario osorio', 'alexander aravena',
    ],
  },
  records: {
    emoji: '📊',
    prioridadBase: 15,
    keywords: [
      'record', 'historico', 'primera vez', 'nunca antes', 'estadistica',
      'racha', 'invicto', 'goleada', 'hat trick', 'triplete', 'debut',
    ],
  },
  polemicas: {
    emoji: '🔥',
    prioridadBase: 18,
    keywords: [
      'polemica', 'var', 'arbitro', 'expulsion', 'roja directa', 'penal',
      'escandalo', 'sancion', 'suspension', 'conflicto', 'crisis', 'despedido', 'renuncia',
    ],
  },
};

// ─── Feeds RSS v4 — cobertura 365 días (Chile primero) ───────────────────────
function gnews(q, lang = 'es', gl = 'CL') {
  const ceid = `${gl}:${lang}`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${lang}&gl=${gl}&ceid=${ceid}`;
}

const RSS_FEEDS = [
  // 🇨🇱 CHILE — prioridad alta
  { name: 'GNews Chile - Primera División', url: gnews('futbol chileno primera division'), lang: 'es', categoria: 'chile' },
  { name: 'GNews Chile - Colo-Colo', url: gnews('Colo Colo'), lang: 'es', categoria: 'chile' },
  { name: 'GNews Chile - U de Chile', url: gnews('Universidad de Chile futbol'), lang: 'es', categoria: 'chile' },
  { name: 'GNews Chile - U Católica', url: gnews('Universidad Catolica futbol'), lang: 'es', categoria: 'chile' },
  { name: 'GNews Chile - Copa Chile y Primera B', url: gnews('"Copa Chile" OR "Primera B" futbol'), lang: 'es', categoria: 'chile' },
  { name: 'GNews Chile - La Roja', url: gnews('seleccion chilena La Roja'), lang: 'es', categoria: 'chile' },
  // 💰 MERCADO DE FICHAJES
  { name: 'GNews - Fichajes', url: gnews('fichajes futbol mercado', 'es', 'ES'), lang: 'es', categoria: 'fichajes' },
  // 🌍 INTERNACIONAL
  { name: 'GNews - Champions League', url: gnews('Champions League', 'es', 'ES'), lang: 'es', categoria: 'internacional' },
  { name: 'GNews - Ligas europeas', url: gnews('Premier League OR LaLiga OR "Serie A" futbol', 'es', 'ES'), lang: 'es', categoria: 'internacional' },
  { name: 'GNews - Libertadores y Sudamericana', url: gnews('Copa Libertadores OR Sudamericana'), lang: 'es', categoria: 'internacional' },
  { name: 'GNews - Eliminatorias y selecciones', url: gnews('eliminatorias sudamericanas OR seleccion futbol'), lang: 'es', categoria: 'internacional' },
  { name: 'ESPN Deportes RSS', url: 'https://espndeportes.espn.com/rss/noticias', lang: 'es', categoria: 'internacional' },
];

// ─── Filtro global: ¿es fútbol? ──────────────────────────────────────────────
const KEYWORDS_FUTBOL = [
  'futbol', 'gol', 'goles', 'partido', 'liga', 'copa', 'club', 'equipo',
  'jugador', 'entrenador', 'tecnico', 'estadio', 'hincha', 'campeonato',
  'seleccion', 'fichaje', 'champions', 'libertadores', 'mundial', 'torneo',
  'delantero', 'arquero', 'portero', 'defensa', 'mediocampista', 'dt',
  ...CATEGORIAS.chile.keywords,
];

module.exports = { COMPETICIONES_API, ROTACION_TABLA, CHILE, CATEGORIAS, RSS_FEEDS, KEYWORDS_FUTBOL };
