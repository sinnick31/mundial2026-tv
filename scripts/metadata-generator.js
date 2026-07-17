const { appendAffiliateFooter } = require('./affiliate-links');

const BASE_HASHTAGS = [
  '#Futbol',
  '#FIFAWorldCup',
  '#Resultados',
  '#Futbol',
  '#Football',
  '#Shorts',
  '#Resumen',
  '#Goles',
  '#FIFA',
  '#WorldCup2026',
];

function cleanTeam(team) {
  return String(team || '').trim();
}

function tagFromTeam(team) {
  return `#${cleanTeam(team).replace(/[^\p{L}\p{N}]/gu, '')}`;
}

function clamp(text, max) {
  const value = String(text || '').trim();
  return value.length <= max ? value : value.slice(0, max - 1).trimEnd() + '…';
}

function winnerLine(homeTeam, awayTeam, homeScore, awayScore) {
  if (homeScore === awayScore) return `El partido terminó empatado: ${homeTeam} ${homeScore}-${awayScore} ${awayTeam}.`;
  const winner = homeScore > awayScore ? homeTeam : awayTeam;
  return `${winner} se quedó con el resultado final: ${homeTeam} ${homeScore}-${awayScore} ${awayTeam}.`;
}

function finalResultTitle(match) {
  const homeTeam = cleanTeam(match.homeTeam || match.equipo1);
  const awayTeam = cleanTeam(match.awayTeam || match.equipo2);
  const homeScore = Number(match.homeScore ?? match.golesLocal ?? match._goles_local ?? 0);
  const awayScore = Number(match.awayScore ?? match.golesVisita ?? match._goles_visita ?? 0);
  const homeFlag = match.homeFlag || '';
  const awayFlag = match.awayFlag || '';
  const lead = homeScore === awayScore
    ? `Empate ${homeScore}-${awayScore}`
    : `${homeTeam} ${homeScore}-${awayScore} ${awayTeam}`;

  return clamp(`${lead} ${homeFlag}${awayFlag} | Resultado final ${match.competencia || 'Fútbol'}`, 95);
}

function finalResultDescription(match = {}) {
  const homeTeam = cleanTeam(match.homeTeam || match.equipo1 || 'Local');
  const awayTeam = cleanTeam(match.awayTeam || match.equipo2 || 'Visitante');
  const homeScore = Number(match.homeScore ?? match.golesLocal ?? match._goles_local ?? 0);
  const awayScore = Number(match.awayScore ?? match.golesVisita ?? match._goles_visita ?? 0);
  const stage = match.competencia || match.matchStage || match.fase || match._fase || 'Fútbol Internacional';
  const venue = [match.venue, match.city].filter(Boolean).join(', ');
  const hashtags = [
    tagFromTeam(homeTeam),
    tagFromTeam(awayTeam),
    ...BASE_HASHTAGS,
  ].filter((tag, index, arr) => tag !== '#' && arr.indexOf(tag) === index);

  const description = [
    '⚽ RESULTADO FINAL ⚽',
    '',
    winnerLine(homeTeam, awayTeam, homeScore, awayScore),
    `${stage}${venue ? ` · ${venue}` : ''}`,
    '',
    'Revive el marcador definitivo, las claves del partido y los momentos más importantes en este resumen con animación 3D cinematográfica.',
    '',
    '💬 ¿Qué te pareció el resultado?',
    '👇 Déjame tu opinión en los comentarios y cuéntame si esperabas este marcador.',
    '',
    '🔔 Suscríbete para no perderte resultados, fichajes y noticias del fútbol chileno e internacional todos los días.',
    '',
    hashtags.join(' '),
  ].join('\n');

  return appendAffiliateFooter(description);
}

function enhanceGeneratedDescription(description) {
  return appendAffiliateFooter(description);
}

function videoName(match = {}) {
  const homeTeam = cleanTeam(match.homeTeam || match.equipo1 || 'Equipo local');
  const awayTeam = cleanTeam(match.awayTeam || match.equipo2 || 'Equipo visitante');
  const homeScore = Number(match.homeScore ?? match.golesLocal ?? match._goles_local ?? 0);
  const awayScore = Number(match.awayScore ?? match.golesVisita ?? match._goles_visita ?? 0);
  return `${homeTeam} ${homeScore}-${awayScore} ${awayTeam}: resultado final con análisis 3D`;
}

module.exports = {
  BASE_HASHTAGS,
  enhanceGeneratedDescription,
  finalResultDescription,
  finalResultTitle,
  videoName,
};
