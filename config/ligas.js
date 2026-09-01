/**
 * config/ligas.js — REAL FOOTBALL NEWSROOM v5
 * Fuente editorial: datos y noticias verificables. La IA no decide los hechos.
 */

const COMPETICIONES_API = {
  2001: { nombre: 'Champions League', hashtag: '#ChampionsLeague', prioridad: 10 },
  2021: { nombre: 'Premier League', hashtag: '#PremierLeague', prioridad: 7 },
  2014: { nombre: 'LaLiga', hashtag: '#LaLiga', prioridad: 7 },
  2019: { nombre: 'Serie A', hashtag: '#SerieA', prioridad: 6 },
  2002: { nombre: 'Bundesliga', hashtag: '#Bundesliga', prioridad: 6 },
  2015: { nombre: 'Ligue 1', hashtag: '#Ligue1', prioridad: 5 },
  2152: { nombre: 'Copa Libertadores', hashtag: '#Libertadores', prioridad: 9 },
  2013: { nombre: 'Brasileirao', hashtag: '#Brasileirao', prioridad: 5 },
  2000: { nombre: 'Mundial FIFA', hashtag: '#Mundial2026', prioridad: 4 },
  2018: { nombre: 'Eurocopa', hashtag: '#Eurocopa', prioridad: 4 },
};

const ROTACION_TABLA = [2021, 2014, 2001, 2019, 2002, 2152, 2021];

const CHILE = {
  // Cobertura editorial nacional 2026
  competiciones: [
    'Liga de Primera',
    'Liga de Ascenso',
    'Segunda División Profesional',
    'Copa Chile',
    'Copa de la Liga',
    'Supercopa de Chile',
    'Liga Femenina',
    'Ascenso Femenino',
    'Fútbol Formativo Nacional',
    'Fútbol Formativo Regional',
    'Sub 20',
    'Sub 18',
    'Sub 16',
    'Sub 15',
    'Sub 14',
    'Sub 13',
    'Liga de Futsal',
    'Ascenso Futsal',
    'Tercera A',
    'Tercera B',
    'La Roja',
    'La Roja Femenina',
    'Selecciones Juveniles',
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
  alias: {
    'colo colo': 'Colo-Colo', 'colocolo': 'Colo-Colo', 'cacique': 'Colo-Colo', 'albos': 'Colo-Colo',
    'u de chile': 'Universidad de Chile', 'universidad de chile': 'Universidad de Chile', 'la u': 'Universidad de Chile', 'azules': 'Universidad de Chile',
    'universidad catolica': 'Universidad Católica', 'la uc': 'Universidad Católica', 'cruzados': 'Universidad Católica', 'catolica': 'Universidad Católica',
    'la roja': 'Selección Chilena', 'seleccion chilena': 'Selección Chilena',
    'coquimbo': 'Coquimbo Unido', 'wanderers': 'Santiago Wanderers',
    'nublense': 'Ñublense', 'ohiggins': "O'Higgins", 'o higgins': "O'Higgins",
  },
};

const CATEGORIAS = {
  colo_colo: {
    emoji: '⚪⚫', prioridadBase: 60,
    keywords: ['colo colo', 'colocolo', 'cacique', 'albos'],
  },
  chile: {
    emoji: '🇨🇱', prioridadBase: 40,
    keywords: [
      'liga de primera', 'primera division', 'campeonato nacional', 'liga de ascenso',
      'primera b', 'segunda division', 'liga 2d', 'copa chile', 'copa de la liga',
      'supercopa de chile', 'liga femenina', 'ascenso femenino', 'futbol chileno',
      'tercera a', 'tercera b', 'futbol formativo', 'futsal chileno',
      ...CHILE.competiciones.map(normalizeForKey),
      ...CHILE.equiposPrimeraA.map(normalizeForKey),
      ...CHILE.equiposPrimeraB.map(normalizeForKey),
    ],
  },
  chilenos_exterior: {
    emoji: '🌎', prioridadBase: 38,
    keywords: [
      'futbolista chileno', 'futbolistas chilenos', 'jugador chileno', 'jugadores chilenos',
      'chilenos en el extranjero', 'chileno en el extranjero', 'seleccion chilena',
      'alexis sanchez', 'ben brereton', 'dario osorio', 'alexander aravena',
      'marcelino nunez', 'guillermo maripan', 'gabriel suazo', 'victor davila',
      'lucas assadi', 'lucas cepeda', 'felipe mora', 'maximiliano falcon',
    ],
  },
  femenino: {
    emoji: '👩⚽', prioridadBase: 28,
    keywords: ['liga femenina', 'ascenso femenino', 'futbol femenino', 'colo colo femenino', 'la roja femenina'],
  },
  formativo: {
    emoji: '🌱', prioridadBase: 22,
    keywords: ['sub 15', 'sub 16', 'sub 17', 'sub 18', 'sub 20', 'sub 23', 'juvenil', 'futbol joven', 'formativo'],
  },
  futsal: {
    emoji: '⚽', prioridadBase: 18,
    keywords: ['futsal', 'liga de futsal', 'ascenso futsal'],
  },
  tercera: {
    emoji: '🟢', prioridadBase: 20,
    keywords: ['tercera a', 'tercera b', 'anfa', 'futbol amateur'],
  },
  fichajes: {
    emoji: '🔄', prioridadBase: 25,
    keywords: ['fichaje', 'fichajes', 'traspaso', 'refuerzo', 'mercado de pases', 'renovacion', 'contrato', 'cedido', 'prestamo'],
  },
  internacional: {
    emoji: '🌍', prioridadBase: 8,
    keywords: ['champions', 'premier league', 'laliga', 'la liga', 'serie a', 'bundesliga', 'ligue 1', 'libertadores', 'sudamericana', 'eliminatorias', 'conmebol', 'uefa', 'fifa'],
  },
  records: {
    emoji: '📊', prioridadBase: 15,
    keywords: ['record', 'historico', 'primera vez', 'racha', 'invicto', 'goleada', 'hat trick', 'triplete'],
  },
  polemicas: {
    emoji: '🔥', prioridadBase: 16,
    keywords: ['polemica', 'var', 'arbitro', 'expulsion', 'penal', 'sancion', 'suspension', 'crisis', 'renuncia'],
  },
};

function normalizeForKey(value) {
  return (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function gnews(q, lang = 'es', gl = 'CL') {
  const ceid = `${gl}:${lang}`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${lang}&gl=${gl}&ceid=${ceid}`;
}

const RSS_FEEDS = [
  // ⭐ COLO-COLO, fuente editorial dominante
  { name: 'Google News — Colo-Colo', url: gnews('"Colo-Colo" futbol'), lang: 'es', categoria: 'colo_colo', prioridad: 100 },
  { name: 'Google News — Colo-Colo oficial', url: gnews('"Colo-Colo" sitio oficial'), lang: 'es', categoria: 'colo_colo', prioridad: 100 },
  { name: 'CSD Colo-Colo', url: gnews('site:csdcolocolo.cl futbol'), lang: 'es', categoria: 'colo_colo', prioridad: 100 },

  // 🇨🇱 COMPETICIONES PROFESIONALES
  { name: 'Google News — Liga de Primera', url: gnews('"Liga de Primera" Chile futbol'), lang: 'es', categoria: 'chile', prioridad: 90 },
  { name: 'Google News — Liga de Ascenso', url: gnews('"Liga de Ascenso" Chile futbol'), lang: 'es', categoria: 'chile', prioridad: 85 },
  { name: 'Google News — Segunda División', url: gnews('"Segunda División" Chile futbol'), lang: 'es', categoria: 'chile', prioridad: 80 },
  { name: 'Google News — Copa Chile', url: gnews('"Copa Chile" futbol'), lang: 'es', categoria: 'chile', prioridad: 88 },
  { name: 'Google News — Copa de la Liga', url: gnews('"Copa de la Liga" Chile futbol'), lang: 'es', categoria: 'chile', prioridad: 88 },
  { name: 'Google News — Supercopa', url: gnews('"Supercopa de Chile" futbol'), lang: 'es', categoria: 'chile', prioridad: 82 },

  // 👩 FÚTBOL FEMENINO
  { name: 'Google News — Liga Femenina', url: gnews('"Liga Femenina" Chile futbol'), lang: 'es', categoria: 'femenino', prioridad: 75 },
  { name: 'Google News — Ascenso Femenino', url: gnews('"Ascenso Femenino" Chile futbol'), lang: 'es', categoria: 'femenino', prioridad: 68 },

  // 🌱 FORMATIVO
  { name: 'Google News — Fútbol Formativo', url: gnews('"fútbol formativo" Chile ANFP'), lang: 'es', categoria: 'formativo', prioridad: 60 },
  { name: 'Google News — Selecciones juveniles', url: gnews('La Roja Sub-20 OR Sub-17 OR Sub-16 OR Sub-15'), lang: 'es', categoria: 'formativo', prioridad: 65 },

  // ⚽ FUTSAL
  { name: 'Google News — Futsal Chile', url: gnews('"Liga de Futsal" Chile'), lang: 'es', categoria: 'futsal', prioridad: 55 },

  // 🟢 TERCERA A/B Y AMATEUR
  { name: 'Google News — Tercera A', url: gnews('"Tercera A" Chile futbol'), lang: 'es', categoria: 'tercera', prioridad: 55 },
  { name: 'Google News — Tercera B', url: gnews('"Tercera B" Chile futbol'), lang: 'es', categoria: 'tercera', prioridad: 50 },

  // 🌎 CHILENOS EN EL EXTERIOR: múltiples geografías para no depender de una sola liga
  { name: 'Google News — Chilenos en Europa', url: gnews('"futbolistas chilenos" Europa OR España OR Italia OR Inglaterra OR Francia'), lang: 'es', gl: 'ES', categoria: 'chilenos_exterior', prioridad: 70 },
  { name: 'Google News — Chilenos en Sudamérica', url: gnews('"futbolistas chilenos" Argentina OR Brasil OR Uruguay OR Paraguay'), lang: 'es', gl: 'AR', categoria: 'chilenos_exterior', prioridad: 72 },
  { name: 'Google News — Chilenos en Norteamérica', url: gnews('"futbolistas chilenos" México OR MLS OR Estados Unidos'), lang: 'es', gl: 'US', categoria: 'chilenos_exterior', prioridad: 65 },
  { name: 'Google News — Chilenos en el extranjero', url: gnews('"futbolistas chilenos" OR "jugador chileno" extranjero'), lang: 'es', gl: 'CL', categoria: 'chilenos_exterior', prioridad: 80 },

  // 🇨🇱 SELECCIÓN MAYOR
  { name: 'Google News — La Roja', url: gnews('"La Roja" selección chilena futbol'), lang: 'es', categoria: 'chile', prioridad: 78 },

  // 🌍 INTERNACIONAL SOLO COMO APOYO
  { name: 'Google News — Libertadores', url: gnews('Copa Libertadores futbol'), lang: 'es', gl: 'AR', categoria: 'internacional', prioridad: 35 },
  { name: 'Google News — Champions', url: gnews('Champions League futbol'), lang: 'es', gl: 'ES', categoria: 'internacional', prioridad: 30 },
];

const KEYWORDS_FUTBOL = [
  'futbol', 'gol', 'goles', 'partido', 'liga', 'copa', 'club', 'equipo', 'jugador',
  'entrenador', 'tecnico', 'estadio', 'hincha', 'campeonato', 'seleccion', 'fichaje',
  'delantero', 'arquero', 'portero', 'defensa', 'mediocampista', 'dt', 'anfp', 'anfa',
  ...CATEGORIAS.chile.keywords,
  ...CATEGORIAS.chilenos_exterior.keywords,
];

module.exports = {
  COMPETICIONES_API, ROTACION_TABLA, CHILE, CATEGORIAS, RSS_FEEDS, KEYWORDS_FUTBOL,
};
