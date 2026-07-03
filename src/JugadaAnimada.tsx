import {
  AbsoluteFill,
  Audio,
  Easing,
  Loop,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";
import { CreditoFuente } from "./PrediccionShorts";

const { fontFamily: oswald } = loadOswald("normal", { weights: ["400", "700"], subsets: ["latin"] });
const { fontFamily: roboto } = loadRoboto("normal", { weights: ["300", "400", "700"], subsets: ["latin"] });

export interface JugadaAnimadaProps {
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeColor: string;
  awayColor: string;
  golesLocal: number;
  golesVisita: number;
  /** Quién metió el gol que se anima. Si no hay dato, se usa una jugada genérica. */
  scorerTeam?: "home" | "away";
  scorerName?: string;
  scorerMinute?: number;
  /** Ángulo narrativo generado por Gemini (gancho), ej: "LA JUGADA QUE NADIE VIO" */
  gancho: string;
  matchStage: string;
  venue: string;
  /** Ruta a un clip de stock (public/broll/...) o staticFile() — opcional */
  brollSrc?: string;
  /** Ruta al .wav generado por generate-narration.js — opcional */
  audioSrc?: string;
  /** Crédito de fuentes de datos, ej: "Datos: football-data.org · ESPN — 02 jul 2026" */
  fuente?: string;
}

export const defaultJugadaProps: JugadaAnimadaProps = {
  homeTeam: "BRASIL",
  awayTeam: "ALEMANIA",
  homeFlag: "🇧🇷",
  awayFlag: "🇩🇪",
  homeColor: "#009c3b",
  awayColor: "#1d1d1d",
  golesLocal: 2,
  golesVisita: 1,
  scorerTeam: "home",
  scorerName: "Vinícius Jr.",
  scorerMinute: 78,
  gancho: "LA JUGADA QUE NADIE VIO",
  matchStage: "OCTAVOS DE FINAL",
  venue: "SoFi Stadium · Los Ángeles",
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const springEase = Easing.bezier(0.34, 1.56, 0.64, 1);
const fi = (frame: number, s: number, e: number, os: number, oe: number, easing = ease) =>
  interpolate(frame, [s, e], [os, oe], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

// ── Fondo: broll real (si hay) o gradiente de estadio ─────────────────────────
const StadiumBackground: React.FC<{ frame: number; brollSrc?: string; dim?: number }> = ({
  frame, brollSrc, dim = 0.6,
}) => {
  const flicker = 0.9 + Math.sin(frame * 0.5) * 0.03;
  return (
    <AbsoluteFill style={{ background: "#040308" }}>
      {brollSrc && (
        <AbsoluteFill style={{ opacity: 0.62 }}>
          {/* Loop: clip de 8s repetido para cubrir toda la jugada sin negro */}
          <Loop durationInFrames={8 * 30}>
            <OffthreadVideo
              src={brollSrc.startsWith("http") ? brollSrc : staticFile(brollSrc)}
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.15) contrast(1.05)" }}
            />
          </Loop>
        </AbsoluteFill>
      )}
      {/* Reflectores de estadio */}
      <AbsoluteFill style={{
        background: `
          radial-gradient(ellipse 60% 40% at 15% 0%, rgba(255,255,255,${0.12 * flicker}) 0%, transparent 60%),
          radial-gradient(ellipse 60% 40% at 85% 0%, rgba(255,255,255,${0.12 * flicker}) 0%, transparent 60%),
          linear-gradient(180deg, rgba(2,2,8,${dim}) 0%, rgba(2,2,8,${dim + 0.1}) 55%, #020205 100%)
        `,
      }} />
    </AbsoluteFill>
  );
};

// ── Fase 1: Intro / contexto ──────────────────────────────────────────────────
const IntroPhase: React.FC<{
  homeTeam: string; awayTeam: string; homeFlag: string; awayFlag: string;
  homeColor: string; awayColor: string; matchStage: string; gancho: string;
}> = ({ homeTeam, awayTeam, homeFlag, awayFlag, homeColor, awayColor, matchStage, gancho }) => {
  const frame = useCurrentFrame();
  const scale = fi(frame, 0, 18, 0.85, 1, springEase);
  const opacity = fi(frame, 0, 15, 0, 1);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        fontFamily: oswald, fontWeight: 700, fontSize: 22, letterSpacing: 5,
        color: "#C9A84C", opacity: fi(frame, 0, 12, 0, 1), marginBottom: 18, textTransform: "uppercase",
      }}>
        ⚽ {matchStage}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 28, opacity, scale: String(scale) }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 72, filter: `drop-shadow(0 0 16px ${homeColor})` }}>{homeFlag}</div>
          <div style={{ fontFamily: oswald, fontWeight: 700, fontSize: 24, color: "#fff", marginTop: 6 }}>{homeTeam}</div>
        </div>
        <div style={{ fontFamily: oswald, fontWeight: 400, fontSize: 30, color: "rgba(255,255,255,0.3)" }}>VS</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 72, filter: `drop-shadow(0 0 16px ${awayColor})` }}>{awayFlag}</div>
          <div style={{ fontFamily: oswald, fontWeight: 700, fontSize: 24, color: "#fff", marginTop: 6 }}>{awayTeam}</div>
        </div>
      </div>

      <div style={{
        marginTop: 50, maxWidth: 760, textAlign: "center", padding: "0 40px",
        opacity: fi(frame, 20, 40, 0, 1),
        transform: `translateY(${fi(frame, 20, 40, 16, 0)}px)`,
      }}>
        <div style={{
          fontFamily: oswald, fontWeight: 900, fontSize: 56, lineHeight: 1.02,
          color: "#fff", textTransform: "uppercase", letterSpacing: -1,
          textShadow: "0 4px 30px rgba(0,0,0,0.6)",
        }}>
          {gancho}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Cancha SVG con la jugada animada ──────────────────────────────────────────
const PITCH_W = 400;
const PITCH_H = 600;

// Trayectoria estilizada (recreación, no coordenadas reales de GPS/tracking)
const WAYPOINTS: [number, number][] = [
  [200, 560], // saque desde mitad de cancha
  [110, 430], // arranque hacia la banda
  [180, 330], // corte hacia el centro, primer rival superado
  [120, 220], // segunda gambeta
  [230, 120], // entra al área
  [198, 55],  // definición
];

function pointOnPath(t: number): [number, number] {
  // t en [0,1] — interpola por segmentos entre waypoints
  const segs = WAYPOINTS.length - 1;
  const pos = t * segs;
  const i = Math.min(Math.floor(pos), segs - 1);
  const localT = pos - i;
  const [x1, y1] = WAYPOINTS[i];
  const [x2, y2] = WAYPOINTS[i + 1];
  return [x1 + (x2 - x1) * localT, y1 + (y2 - y1) * localT];
}

const RIVAL_MARKERS: [number, number][] = [[190, 365], [230, 215], [150, 110]];

const PitchScene: React.FC<{
  frame: number; teamColor: string; rivalColor: string;
  scorerName?: string; scorerMinute?: number; goalFrame: number;
}> = ({ frame, teamColor, rivalColor, scorerName, scorerMinute, goalFrame }) => {
  const ballT = fi(frame, 10, goalFrame, 0, 1, Easing.inOut(Easing.quad));
  const [bx, by] = pointOnPath(ballT);

  const trailOpacity = fi(frame, 10, 30, 0, 0.9);
  const goalFlash = frame >= goalFrame ? fi(frame, goalFrame, goalFrame + 6, 1, 0) : 0;
  const goalScale = frame >= goalFrame ? fi(frame, goalFrame, goalFrame + 14, 0.6, 1, springEase) : 0;
  const netShake = frame >= goalFrame ? Math.sin((frame - goalFrame) * 2.2) * fi(frame, goalFrame, goalFrame + 25, 6, 0) : 0;

  // Trail de puntos ya recorridos
  const trailSteps = 22;
  const dots = Array.from({ length: trailSteps }, (_, i) => {
    const t = (i / trailSteps) * ballT;
    return pointOnPath(t);
  });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={PITCH_W} height={PITCH_H} viewBox={`0 0 ${PITCH_W} ${PITCH_H}`} style={{ overflow: "visible" }}>
        {/* Pasto con franjas */}
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={0} y={(i * PITCH_H) / 12} width={PITCH_W} height={PITCH_H / 12}
            fill={i % 2 === 0 ? "rgba(20,60,30,0.55)" : "rgba(26,75,38,0.55)"} />
        ))}
        {/* Líneas de cancha */}
        <rect x={20} y={20} width={PITCH_W - 40} height={PITCH_H - 40} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
        <line x1={20} y1={PITCH_H - 100} x2={PITCH_W - 20} y2={PITCH_H - 100} stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
        <circle cx={PITCH_W / 2} cy={PITCH_H - 100} r={55} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} />
        {/* Área */}
        <rect x={90} y={20} width={PITCH_W - 180} height={140} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
        <rect x={140} y={20} width={PITCH_W - 280} height={60} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={2} />
        {/* Arco */}
        <rect x={160} y={6} width={80} height={16} fill="none" stroke="#ffffff" strokeWidth={3}
          transform={`translate(0 ${netShake})`} />

        {/* Rivales superados */}
        {RIVAL_MARKERS.map(([rx, ry], i) => (
          <g key={i} opacity={fi(frame, 5, 20, 0, 0.85)}>
            <circle cx={rx} cy={ry} r={11} fill={rivalColor} opacity={0.55} />
            <circle cx={rx} cy={ry} r={11} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={1.5} />
          </g>
        ))}

        {/* Trail del balón */}
        {dots.map(([dx, dy], i) => (
          <circle key={i} cx={dx} cy={dy} r={2.4} fill={teamColor} opacity={(i / trailSteps) * trailOpacity} />
        ))}

        {/* Balón */}
        <g transform={`translate(${bx} ${by})`}>
          <circle r={9} fill="#fff" stroke={teamColor} strokeWidth={2.5}
            style={{ filter: `drop-shadow(0 0 10px ${teamColor})` }} />
        </g>

        {/* Flash de gol */}
        {goalFlash > 0 && (
          <circle cx={200} cy={50} r={140 * (1 + (1 - goalFlash) * 1.5)} fill={teamColor} opacity={goalFlash * 0.5} />
        )}
      </svg>

      {/* Caption GOL */}
      {frame >= goalFrame && (
        <div style={{
          position: "absolute", bottom: "16%", left: 0, right: 0, textAlign: "center",
          transform: `scale(${goalScale})`,
        }}>
          <div style={{
            display: "inline-block", background: teamColor, color: "#000",
            fontFamily: oswald, fontWeight: 900, fontSize: 64, letterSpacing: 2,
            padding: "10px 36px", borderRadius: 14, textTransform: "uppercase",
            boxShadow: `0 0 50px ${teamColor}aa`,
          }}>
            ⚽ ¡GOL!
          </div>
          {(scorerName || scorerMinute) && (
            <div style={{
              fontFamily: roboto, fontWeight: 400, fontSize: 26, color: "#fff",
              marginTop: 14, opacity: fi(frame, goalFrame + 8, goalFrame + 22, 0, 1),
            }}>
              {scorerName ? `${scorerName} ` : ""}{scorerMinute ? `· min ${scorerMinute}'` : ""}
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ── Fase 3: Marcador final + branding ─────────────────────────────────────────
const FinalScorePhase: React.FC<{
  homeTeam: string; awayTeam: string; golesLocal: number; golesVisita: number;
  homeColor: string; awayColor: string;
}> = ({ homeTeam, awayTeam, golesLocal, golesVisita, homeColor, awayColor }) => {
  const frame = useCurrentFrame();
  const scale = fi(frame, 0, 18, 0.7, 1, springEase);
  const opacity = fi(frame, 0, 14, 0, 1);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30 }}>
      <div style={{ opacity, scale: String(scale), display: "flex", alignItems: "center", gap: 24 }}>
        <span style={{ fontFamily: oswald, fontWeight: 700, fontSize: 30, color: "#fff" }}>{homeTeam}</span>
        <span style={{
          fontFamily: oswald, fontWeight: 900, fontSize: 90, color: homeColor,
          textShadow: `0 0 30px ${homeColor}`,
        }}>{golesLocal}</span>
        <span style={{ fontFamily: oswald, fontWeight: 400, fontSize: 36, color: "rgba(255,255,255,0.3)" }}>—</span>
        <span style={{
          fontFamily: oswald, fontWeight: 900, fontSize: 90, color: awayColor === "#1d1d1d" ? "#aaa" : awayColor,
          textShadow: `0 0 30px ${awayColor}`,
        }}>{golesVisita}</span>
        <span style={{ fontFamily: oswald, fontWeight: 700, fontSize: 30, color: "#fff" }}>{awayTeam}</span>
      </div>

      <div style={{
        opacity: fi(frame, 25, 45, 0, 1), display: "flex", alignItems: "center", gap: 10,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,168,76,0.35)",
        padding: "12px 30px", borderRadius: 40,
      }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        <span style={{
          fontFamily: oswald, fontWeight: 700, fontSize: 20, letterSpacing: 3,
          color: "rgba(255,255,255,0.9)", textTransform: "uppercase",
        }}>
          MUNDIAL 2026 TV
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ── Composición principal ──────────────────────────────────────────────────────
export const JugadaAnimada: React.FC<JugadaAnimadaProps> = (props) => {
  const {
    homeTeam, awayTeam, homeFlag, awayFlag, homeColor, awayColor,
    golesLocal, golesVisita, scorerTeam, scorerName, scorerMinute,
    gancho, matchStage, brollSrc, audioSrc, fuente,
  } = props;

  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const T_INTRO = Math.round(3.2 * fps);
  const T_GOAL_FRAME = T_INTRO + Math.round(2.6 * fps); // momento exacto del gol dentro de la fase 2
  const T_PITCH_END = Math.max(T_GOAL_FRAME + Math.round(2.2 * fps), durationInFrames - Math.round(3 * fps));
  const scorerColor = scorerTeam === "away" ? awayColor : homeColor;
  const rivalColor = scorerTeam === "away" ? homeColor : awayColor;

  return (
    <AbsoluteFill style={{ background: "#020205", overflow: "hidden" }}>
      <StadiumBackground frame={frame} brollSrc={brollSrc} dim={frame < T_INTRO ? 0.4 : 0.66} />

      {audioSrc && (
        <Audio src={audioSrc.startsWith("http") ? audioSrc : staticFile(audioSrc)} />
      )}

      <CreditoFuente fuente={fuente} />

      <Sequence from={0} durationInFrames={T_INTRO}>
        <IntroPhase
          homeTeam={homeTeam} awayTeam={awayTeam} homeFlag={homeFlag} awayFlag={awayFlag}
          homeColor={homeColor} awayColor={awayColor} matchStage={matchStage} gancho={gancho}
        />
      </Sequence>

      <Sequence from={T_INTRO} durationInFrames={T_PITCH_END - T_INTRO}>
        <PitchScene
          frame={frame - T_INTRO}
          teamColor={scorerColor}
          rivalColor={rivalColor}
          scorerName={scorerName}
          scorerMinute={scorerMinute}
          goalFrame={T_GOAL_FRAME - T_INTRO}
        />
      </Sequence>

      <Sequence from={T_PITCH_END} durationInFrames={Math.max(durationInFrames - T_PITCH_END, 30)}>
        <FinalScorePhase
          homeTeam={homeTeam} awayTeam={awayTeam}
          golesLocal={golesLocal} golesVisita={golesVisita}
          homeColor={homeColor} awayColor={awayColor}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
