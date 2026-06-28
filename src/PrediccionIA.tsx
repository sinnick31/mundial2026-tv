import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";

const { fontFamily: oswald } = loadOswald("normal", { weights: ["400", "700"], subsets: ["latin"] });
const { fontFamily: roboto } = loadRoboto("normal", { weights: ["300", "400", "700"], subsets: ["latin"] });

export interface PrediccionIAProps {
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeColor: string;
  awayColor: string;
  predictedHome: number;
  predictedAway: number;
  winner: string;
  confidence: number;
  reasoning: string;
  keyFactor: string;
  matchDate: string;
  matchStage: string;
  venue: string;
}

export const defaultPrediccionProps: PrediccionIAProps = {
  homeTeam: "BRASIL",
  awayTeam: "ALEMANIA",
  homeFlag: "🇧🇷",
  awayFlag: "🇩🇪",
  homeColor: "#009c3b",
  awayColor: "#1d1d1d",
  predictedHome: 2,
  predictedAway: 1,
  winner: "BRASIL",
  confidence: 74,
  reasoning: "Brasil llega con Vinicius Jr. imparable y 3 victorias consecutivas. Alemania sufre sin Müller.",
  keyFactor: "Velocidad en contraataque brasileño",
  matchDate: "28 JUN 2026",
  matchStage: "OCTAVOS DE FINAL",
  venue: "SoFi Stadium · Los Ángeles",
};

// ── Helpers ────────────────────────────────────────────────────────────────
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const spring = Easing.bezier(0.34, 1.56, 0.64, 1);

const fi = (frame: number, s: number, e: number, os: number, oe: number, ease = easeOut) =>
  interpolate(frame, [s, e], [os, oe], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

// Typewriter effect
function typewriter(frame: number, text: string, startAt: number, charsPerFrame = 1.8) {
  const chars = Math.floor(fi(frame, startAt, startAt + text.length / charsPerFrame, 0, text.length));
  return text.substring(0, chars);
}

// ── Background cósmico ─────────────────────────────────────────────────────
const CosmicBackground: React.FC<{ homeColor: string; awayColor: string; frame: number }> = ({
  homeColor, awayColor, frame
}) => {
  const pulse = Math.sin(frame * 0.03) * 0.15 + 0.85;
  return (
    <AbsoluteFill style={{
      background: `
        radial-gradient(ellipse at 15% 20%, ${homeColor}40 0%, transparent 50%),
        radial-gradient(ellipse at 85% 80%, ${awayColor}40 0%, transparent 50%),
        radial-gradient(ellipse at 50% 50%, #0d0520${Math.round(pulse * 255).toString(16)} 0%, transparent 70%),
        linear-gradient(160deg, #060618 0%, #0a0520 40%, #060618 100%)
      `,
    }} />
  );
};

// ── Grid lines IA ──────────────────────────────────────────────────────────
const IAGrid: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = fi(frame, 0, 40, 0, 0.07);
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={`h${i}`} style={{
          position: "absolute", left: 0, right: 0,
          top: i * 96, height: 1,
          background: "linear-gradient(90deg, transparent, #00D4FF, transparent)",
        }} />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={`v${i}`} style={{
          position: "absolute", top: 0, bottom: 0,
          left: i * 90, width: 1,
          background: "linear-gradient(180deg, transparent, #00D4FF, transparent)",
        }} />
      ))}
    </AbsoluteFill>
  );
};

// ── Badge "IA PREDICE" ─────────────────────────────────────────────────────
const IABadge: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = fi(frame, 0, 20, 0, 1);
  const scale = fi(frame, 0, 20, 0.5, 1, spring);
  const pulse = Math.sin(frame * 0.12) * 0.15 + 0.85;

  return (
    <div style={{ opacity, scale: String(scale), textAlign: "center", paddingTop: 80 }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 12,
        background: "linear-gradient(135deg, #00D4FF22, #7B2FFF22)",
        border: "1.5px solid #00D4FF",
        padding: "14px 32px", borderRadius: 50,
        boxShadow: `0 0 ${30 * pulse}px #00D4FF44, 0 0 ${60 * pulse}px #00D4FF22`,
      }}>
        <span style={{ fontSize: 26 }}>🤖</span>
        <span style={{
          fontFamily: oswald, fontWeight: 700, fontSize: 28,
          letterSpacing: 5, color: "#00D4FF", textTransform: "uppercase",
        }}>IA PREDICE</span>
      </div>
      <div style={{
        fontFamily: roboto, fontWeight: 300, fontSize: 18,
        letterSpacing: 4, color: "rgba(255,255,255,0.45)",
        marginTop: 10, textTransform: "uppercase",
      }}>
        FIFA World Cup 2026™
      </div>
    </div>
  );
};

// ── Matchup de equipos ────────────────────────────────────────────────────
const MatchupDisplay: React.FC<{
  frame: number; homeTeam: string; awayTeam: string;
  homeFlag: string; awayFlag: string; homeColor: string; awayColor: string;
  matchStage: string;
}> = ({ frame, homeTeam, awayTeam, homeFlag, awayFlag, homeColor, awayColor, matchStage }) => {
  const startAt = 30;
  const txHome = fi(frame, startAt, startAt + 25, -80, 0, easeOut);
  const txAway = fi(frame, startAt, startAt + 25, 80, 0, easeOut);
  const opacity = fi(frame, startAt, startAt + 20, 0, 1);
  const vsScale = fi(frame, startAt + 15, startAt + 35, 0.2, 1, spring);
  const vsOpacity = fi(frame, startAt + 15, startAt + 30, 0, 1);

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      {/* Fase */}
      <div style={{
        fontFamily: oswald, fontWeight: 400, fontSize: 20,
        letterSpacing: 4, color: "#C9A84C", marginBottom: 24,
        opacity: fi(frame, 25, 45, 0, 1),
      }}>
        {matchStage}
      </div>

      {/* Teams row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        {/* Home */}
        <div style={{ opacity, translate: `${txHome}px 0px`, textAlign: "center", width: 280 }}>
          <div style={{ fontSize: 88, filter: `drop-shadow(0 0 20px ${homeColor})` }}>{homeFlag}</div>
          <div style={{
            fontFamily: oswald, fontWeight: 700, fontSize: 28,
            color: "#fff", letterSpacing: 2, marginTop: 8,
            textShadow: `0 0 20px ${homeColor}`,
          }}>{homeTeam}</div>
        </div>

        {/* VS */}
        <div style={{ opacity: vsOpacity, scale: String(vsScale), textAlign: "center" }}>
          <div style={{
            fontFamily: oswald, fontWeight: 700, fontSize: 42,
            color: "rgba(255,255,255,0.2)", letterSpacing: 2,
          }}>VS</div>
        </div>

        {/* Away */}
        <div style={{ opacity, translate: `${txAway}px 0px`, textAlign: "center", width: 280 }}>
          <div style={{ fontSize: 88, filter: `drop-shadow(0 0 20px ${awayColor})` }}>{awayFlag}</div>
          <div style={{
            fontFamily: oswald, fontWeight: 700, fontSize: 28,
            color: "#fff", letterSpacing: 2, marginTop: 8,
            textShadow: `0 0 20px ${awayColor}`,
          }}>{awayTeam}</div>
        </div>
      </div>
    </div>
  );
};

// ── Separador ─────────────────────────────────────────────────────────────
const Divider: React.FC<{ frame: number; startAt: number; color?: string }> = ({
  frame, startAt, color = "#00D4FF"
}) => {
  const scaleX = fi(frame, startAt, startAt + 25, 0, 1, easeOut);
  const opacity = fi(frame, startAt, startAt + 15, 0, 1);
  return (
    <div style={{ opacity, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "20px 0" }}>
      <div style={{ height: 1, width: 140 * scaleX, background: `linear-gradient(90deg, transparent, ${color})` }} />
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, opacity: scaleX }} />
      <div style={{ height: 1, width: 140 * scaleX, background: `linear-gradient(90deg, ${color}, transparent)` }} />
    </div>
  );
};

// ── Análisis IA (typewriter) ───────────────────────────────────────────────
const IAAnalysis: React.FC<{ frame: number; startAt: number; reasoning: string; keyFactor: string }> = ({
  frame, startAt, reasoning, keyFactor
}) => {
  const containerOpacity = fi(frame, startAt, startAt + 15, 0, 1);
  const visibleReasoning = typewriter(frame, reasoning, startAt + 10);
  const keyOpacity = fi(frame, startAt + reasoning.length / 1.8 + 10, startAt + reasoning.length / 1.8 + 30, 0, 1);

  return (
    <div style={{ opacity: containerOpacity, padding: "0 60px", textAlign: "center" }}>
      {/* Label */}
      <div style={{
        fontFamily: roboto, fontWeight: 700, fontSize: 14,
        letterSpacing: 4, color: "#00D4FF", textTransform: "uppercase",
        marginBottom: 12,
      }}>
        🧠 Análisis de IA
      </div>

      {/* Reasoning box */}
      <div style={{
        background: "rgba(0,212,255,0.06)",
        border: "1px solid rgba(0,212,255,0.2)",
        borderRadius: 12, padding: "20px 24px",
        minHeight: 90,
      }}>
        <span style={{
          fontFamily: roboto, fontWeight: 400, fontSize: 22,
          color: "rgba(255,255,255,0.9)", lineHeight: 1.5,
        }}>
          {visibleReasoning}
          <span style={{
            display: "inline-block", width: 2, height: 22,
            background: "#00D4FF",
            opacity: Math.sin(frame * 0.25) > 0 ? 1 : 0,
            marginLeft: 2, verticalAlign: "middle",
          }} />
        </span>
      </div>

      {/* Key factor */}
      <div style={{ opacity: keyOpacity, marginTop: 14 }}>
        <span style={{
          fontFamily: roboto, fontWeight: 700, fontSize: 16,
          color: "#C9A84C", letterSpacing: 1,
        }}>
          ⚡ Factor clave:
        </span>
        <span style={{
          fontFamily: roboto, fontWeight: 400, fontSize: 16,
          color: "rgba(255,255,255,0.7)", marginLeft: 8,
        }}>
          {keyFactor}
        </span>
      </div>
    </div>
  );
};

// ── Predicción de marcador ─────────────────────────────────────────────────
const PredictedScore: React.FC<{
  frame: number; startAt: number;
  homeTeam: string; awayTeam: string;
  predictedHome: number; predictedAway: number;
  winner: string; homeColor: string; awayColor: string;
}> = ({ frame, startAt, homeTeam, awayTeam, predictedHome, predictedAway, winner, homeColor, awayColor }) => {
  const opacity = fi(frame, startAt, startAt + 20, 0, 1);
  const scale = fi(frame, startAt, startAt + 20, 0.5, 1, spring);

  const homeNum = Math.round(fi(frame, startAt + 5, startAt + 30, 0, predictedHome));
  const awayNum = Math.round(fi(frame, startAt + 5, startAt + 30, 0, predictedAway));

  return (
    <div style={{ opacity, scale: String(scale), textAlign: "center" }}>
      <div style={{
        fontFamily: roboto, fontWeight: 300, fontSize: 16,
        letterSpacing: 4, color: "rgba(255,255,255,0.4)",
        textTransform: "uppercase", marginBottom: 8,
      }}>
        Resultado predicho
      </div>

      <div style={{
        display: "inline-flex", alignItems: "center", gap: 20,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, padding: "16px 40px",
      }}>
        <span style={{
          fontFamily: oswald, fontWeight: 700, fontSize: 72,
          color: winner === homeTeam ? homeColor : "rgba(255,255,255,0.6)",
          textShadow: winner === homeTeam ? `0 0 30px ${homeColor}` : "none",
        }}>{homeNum}</span>

        <span style={{
          fontFamily: oswald, fontWeight: 400, fontSize: 32,
          color: "rgba(255,255,255,0.3)",
        }}>—</span>

        <span style={{
          fontFamily: oswald, fontWeight: 700, fontSize: 72,
          color: winner === awayTeam ? awayColor : "rgba(255,255,255,0.6)",
          textShadow: winner === awayTeam ? `0 0 30px ${awayColor}` : "none",
        }}>{awayNum}</span>
      </div>

      <div style={{
        fontFamily: oswald, fontWeight: 700, fontSize: 22,
        color: "#C9A84C", letterSpacing: 3, marginTop: 10,
        opacity: fi(frame, startAt + 25, startAt + 40, 0, 1),
      }}>
        🏆 GANADOR: {winner}
      </div>
    </div>
  );
};

// ── Barra de confianza ─────────────────────────────────────────────────────
const ConfidenceBar: React.FC<{ frame: number; startAt: number; confidence: number }> = ({
  frame, startAt, confidence
}) => {
  const opacity = fi(frame, startAt, startAt + 15, 0, 1);
  const barWidth = fi(frame, startAt + 10, startAt + 40, 0, confidence, easeOut);
  const numVal = Math.round(fi(frame, startAt + 10, startAt + 40, 0, confidence));

  const color = confidence >= 70 ? "#00FF88" : confidence >= 55 ? "#FFD700" : "#FF6B35";

  return (
    <div style={{ opacity, padding: "0 60px" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8,
      }}>
        <span style={{
          fontFamily: roboto, fontWeight: 400, fontSize: 16,
          color: "rgba(255,255,255,0.5)", letterSpacing: 2, textTransform: "uppercase",
        }}>
          Confianza IA
        </span>
        <span style={{
          fontFamily: oswald, fontWeight: 700, fontSize: 28,
          color, textShadow: `0 0 10px ${color}`,
        }}>
          {numVal}%
        </span>
      </div>

      {/* Track */}
      <div style={{
        background: "rgba(255,255,255,0.08)", borderRadius: 4, height: 8, overflow: "hidden",
      }}>
        <div style={{
          width: `${barWidth}%`, height: "100%", borderRadius: 4,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 12px ${color}`,
        }} />
      </div>
    </div>
  );
};

// ── Branding ───────────────────────────────────────────────────────────────
const Branding: React.FC<{ frame: number; startAt: number; matchDate: string }> = ({
  frame, startAt, matchDate
}) => {
  const opacity = fi(frame, startAt, startAt + 20, 0, 1);
  const ty = fi(frame, startAt, startAt + 20, 20, 0, easeOut);

  return (
    <div style={{ opacity, translate: `0px ${ty}px`, textAlign: "center", paddingBottom: 70 }}>
      <div style={{
        fontFamily: roboto, fontWeight: 300, fontSize: 17,
        color: "rgba(255,255,255,0.35)", letterSpacing: 2,
        marginBottom: 12, textTransform: "uppercase",
      }}>
        📅 {matchDate}
      </div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(201,168,76,0.3)",
        padding: "12px 28px", borderRadius: 40,
      }}>
        <span style={{ fontSize: 20 }}>⚽</span>
        <span style={{
          fontFamily: oswald, fontWeight: 700, fontSize: 20,
          letterSpacing: 3, color: "rgba(255,255,255,0.85)", textTransform: "uppercase",
        }}>
          MUNDIAL 2026 TV
        </span>
      </div>
      <div style={{
        fontFamily: roboto, fontWeight: 300, fontSize: 15,
        color: "rgba(255,255,255,0.3)", letterSpacing: 2,
        marginTop: 6, textTransform: "uppercase",
      }}>
        @eliasvaldivia7233
      </div>
    </div>
  );
};

// ── COMPOSICIÓN PRINCIPAL ──────────────────────────────────────────────────
export const PrediccionIA: React.FC<PrediccionIAProps> = (props) => {
  const {
    homeTeam, awayTeam, homeFlag, awayFlag, homeColor, awayColor,
    predictedHome, predictedAway, winner, confidence,
    reasoning, keyFactor, matchDate, matchStage, venue,
  } = props;

  const frame = useCurrentFrame();

  const T_BADGE      = 0;
  const T_MATCHUP    = 30;
  const T_DIV1       = 75;
  const T_ANALYSIS   = 90;
  const T_SCORE      = 90 + Math.ceil(reasoning.length / 1.8) + 15;
  const T_DIV2       = T_SCORE + 45;
  const T_CONFIDENCE = T_DIV2 + 10;
  const T_BRANDING   = T_CONFIDENCE + 55;

  return (
    <AbsoluteFill style={{ background: "#060618", overflow: "hidden" }}>
      <CosmicBackground homeColor={homeColor} awayColor={awayColor} frame={frame} />
      <IAGrid frame={frame} />

      <AbsoluteFill style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "space-between",
      }}>
        {/* TOP */}
        <IABadge frame={frame} />

        {/* MIDDLE */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: 0 }}>
          <MatchupDisplay
            frame={frame}
            homeTeam={homeTeam} awayTeam={awayTeam}
            homeFlag={homeFlag} awayFlag={awayFlag}
            homeColor={homeColor} awayColor={awayColor}
            matchStage={matchStage}
          />
          <Divider frame={frame} startAt={T_DIV1} color="#00D4FF" />
          <IAAnalysis frame={frame} startAt={T_ANALYSIS} reasoning={reasoning} keyFactor={keyFactor} />
          <Divider frame={frame} startAt={T_DIV2} color="#C9A84C" />
          <PredictedScore
            frame={frame} startAt={T_SCORE}
            homeTeam={homeTeam} awayTeam={awayTeam}
            predictedHome={predictedHome} predictedAway={predictedAway}
            winner={winner} homeColor={homeColor} awayColor={awayColor}
          />
          <div style={{ marginTop: 16, width: "100%" }}>
            <ConfidenceBar frame={frame} startAt={T_CONFIDENCE} confidence={confidence} />
          </div>
        </div>

        {/* BOTTOM */}
        <Branding frame={frame} startAt={T_BRANDING} matchDate={matchDate} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
