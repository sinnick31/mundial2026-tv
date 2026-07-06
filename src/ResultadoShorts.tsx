import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";

// ── Fonts ──────────────────────────────────────────────────────────────────
const { fontFamily: oswald } = loadOswald("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});
const { fontFamily: roboto } = loadRoboto("normal", {
  weights: ["300", "400", "700"],
  subsets: ["latin"],
});

// ── Types ──────────────────────────────────────────────────────────────────
export interface ResultadoShortsProps {
  /** Nombre del equipo local */
  homeTeam: string;
  /** Nombre del equipo visitante */
  awayTeam: string;
  /** Goles equipo local */
  homeScore: number;
  /** Goles equipo visitante */
  awayScore: number;
  /** Bandera emoji equipo local */
  homeFlag: string;
  /** Bandera emoji equipo visitante */
  awayFlag: string;
  /** Color primario equipo local (hex) */
  homeColor: string;
  /** Color primario equipo visitante (hex) */
  awayColor: string;
  /** Fecha del partido (ej: "15 JUN 2026") */
  matchDate: string;
  /** Fase del torneo (ej: "GRUPO A · JORNADA 1") */
  matchStage: string;
  /** Estadio */
  venue: string;
  /** Ciudad */
  city: string;
}

// ── Defaults para preview en Remotion Studio ──────────────────────────────
export const defaultProps: ResultadoShortsProps = {
  homeTeam: "BRASIL",
  awayTeam: "ARGENTINA",
  homeScore: 2,
  awayScore: 1,
  homeFlag: "🇧🇷",
  awayFlag: "🇦🇷",
  homeColor: "#009c3b",
  awayColor: "#74acdf",
  matchDate: "25 JUN 2026",
  matchStage: "CUARTOS DE FINAL",
  venue: "AT&T Stadium",
  city: "Dallas, Texas",
};

// ── Helpers de animación ───────────────────────────────────────────────────
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeIn = Easing.bezier(0.4, 0, 1, 1);

function fadeIn(frame: number, start: number, dur = 20) {
  return interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
}

function slideUp(frame: number, start: number, dur = 25, px = 40) {
  return interpolate(frame, [start, start + dur], [px, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
}

function slideFromLeft(frame: number, start: number, dur = 30) {
  return interpolate(frame, [start, start + dur], [-120, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
}

function slideFromRight(frame: number, start: number, dur = 30) {
  return interpolate(frame, [start, start + dur], [120, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
}

function countUp(frame: number, start: number, target: number, dur = 35) {
  return Math.round(
    interpolate(frame, [start, start + dur], [0, target], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeOut,
    })
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────

/** Fondo de estudio deportivo con pantallas LED */
const Background: React.FC<{ homeColor: string; awayColor: string }> = ({
  homeColor,
  awayColor,
}) => {
  const frame = useCurrentFrame();
  const dolly = interpolate(frame, [0, 300], [1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const lightSweep = interpolate(frame % 90, [0, 45, 90], [-25, 35, 105], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#080912", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          scale: String(dolly),
          background: `
            radial-gradient(ellipse at 18% 16%, ${homeColor}78 0%, transparent 30%),
            radial-gradient(ellipse at 82% 18%, ${awayColor}78 0%, transparent 32%),
            linear-gradient(180deg, #161827 0%, #080912 62%, #05050a 100%)
          `,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 210,
          height: 430,
          borderRadius: 22,
          border: "2px solid rgba(245,208,110,0.35)",
          background: `
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(0deg, rgba(255,255,255,0.05) 1px, transparent 1px),
            radial-gradient(circle at ${lightSweep}% 20%, rgba(255,255,255,0.26), transparent 22%),
            linear-gradient(135deg, ${homeColor}cc, #10142a 48%, ${awayColor}cc)
          `,
          backgroundSize: "46px 46px, 46px 46px, auto, auto",
          boxShadow: "0 28px 80px rgba(0,0,0,0.65), inset 0 0 80px rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.18), transparent 35%, rgba(0,0,0,0.25))",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 78,
            background: "rgba(0,0,0,0.32)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: -140,
          right: -140,
          bottom: -120,
          height: 510,
          background:
            "radial-gradient(ellipse at center, rgba(255,255,255,0.16), rgba(255,255,255,0.03) 36%, transparent 64%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 430,
          background:
            "linear-gradient(180deg, transparent 0%, rgba(7,8,18,0.4) 30%, rgba(0,0,0,0.92) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Cintillo LED con el marcador, visible desde el primer segundo */
const StudioScoreboard: React.FC<{
  frame: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeFlag: string;
  awayFlag: string;
}> = ({ frame, homeTeam, awayTeam, homeScore, awayScore, homeFlag, awayFlag }) => {
  const opacity = fadeIn(frame, 8, 18);
  const ty = slideUp(frame, 8, 20, 24);

  return (
    <div
      style={{
        opacity,
        translate: `0px ${ty}px`,
        position: "absolute",
        left: 96,
        right: 96,
        top: 278,
        height: 236,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
      }}
    >
      <div
        style={{
          fontFamily: oswald,
          fontWeight: 700,
          fontSize: 52,
          color: "#ffffff",
          textAlign: "right",
          width: 270,
          textTransform: "uppercase",
          textShadow: "0 6px 22px rgba(0,0,0,0.6)",
        }}
      >
        {homeFlag} {homeTeam}
      </div>
      <div
        style={{
          fontFamily: oswald,
          fontWeight: 700,
          fontSize: 126,
          lineHeight: 1,
          color: "#f5d06e",
          textShadow: "0 0 32px rgba(245,208,110,0.65)",
        }}
      >
        {homeScore}-{awayScore}
      </div>
      <div
        style={{
          fontFamily: oswald,
          fontWeight: 700,
          fontSize: 52,
          color: "#ffffff",
          width: 270,
          textTransform: "uppercase",
          textShadow: "0 6px 22px rgba(0,0,0,0.6)",
        }}
      >
        {awayTeam} {awayFlag}
      </div>
    </div>
  );
};

const StudioHost: React.FC<{
  frame: number;
  startAt: number;
  emoji: string;
  name: string;
  role: string;
  color: string;
  x: number;
}> = ({ frame, startAt, emoji, name, role, color, x }) => {
  const opacity = fadeIn(frame, startAt, 18);
  const ty = slideUp(frame, startAt, 20, 36);
  const bob = Math.sin((frame + startAt) / 12) * 7;
  const mouth = frame % 28 < 14 ? 1 : 0.25;

  return (
    <div
      style={{
        opacity,
        translate: `${x}px ${ty + bob}px`,
        position: "absolute",
        bottom: 184,
        left: "50%",
        width: 205,
        marginLeft: -102,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 150,
          height: 150,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 82,
          background: `radial-gradient(circle at 35% 25%, #ffffff 0%, ${color} 48%, #11131f 100%)`,
          border: "4px solid rgba(255,255,255,0.72)",
          boxShadow: `0 0 36px ${color}aa, 0 22px 46px rgba(0,0,0,0.52)`,
        }}
      >
        {emoji}
      </div>
      <div
        style={{
          width: 42,
          height: 8 * mouth,
          borderRadius: 12,
          background: "#17141a",
          marginTop: -34,
          marginBottom: 36,
          boxShadow: "0 0 8px rgba(255,255,255,0.28)",
        }}
      />
      <div
        style={{
          minWidth: 162,
          textAlign: "center",
          padding: "8px 14px 9px",
          borderRadius: 8,
          background: "rgba(6,7,14,0.82)",
          border: `1px solid ${color}aa`,
          boxShadow: "0 12px 24px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            fontFamily: oswald,
            fontWeight: 700,
            fontSize: 24,
            color: "#ffffff",
            letterSpacing: 1,
            lineHeight: 1,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: roboto,
            fontWeight: 700,
            fontSize: 11,
            color: "#f5d06e",
            letterSpacing: 1.6,
            marginTop: 5,
            textTransform: "uppercase",
          }}
        >
          {role}
        </div>
      </div>
    </div>
  );
};

const CommentatorDesk: React.FC<{ frame: number }> = ({ frame }) => {
  const glow = interpolate(frame % 80, [0, 40, 80], [0.65, 1, 0.65], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <StudioHost
        frame={frame}
        startAt={48}
        emoji="🐶"
        name="KRONO"
        role="Relator"
        color="#c28a45"
        x={-250}
      />
      <StudioHost
        frame={frame}
        startAt={58}
        emoji="🐶"
        name="ISSY"
        role="Análisis"
        color="#f0c15a"
        x={0}
      />
      <StudioHost
        frame={frame}
        startAt={68}
        emoji="🐱"
        name="KUKY"
        role="Táctica"
        color="#9aa7b7"
        x={250}
      />
      <div
        style={{
          position: "absolute",
          left: 116,
          right: 116,
          bottom: 104,
          height: 150,
          borderRadius: "30px 30px 12px 12px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(8,9,18,0.96) 42%, rgba(0,0,0,1))",
          border: "2px solid rgba(245,208,110,0.28)",
          boxShadow: `0 0 ${38 * glow}px rgba(245,208,110,0.22), 0 30px 70px rgba(0,0,0,0.72)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 204,
          right: 204,
          bottom: 145,
          height: 42,
          borderRadius: 8,
          background: "linear-gradient(90deg, transparent, rgba(245,208,110,0.8), transparent)",
          opacity: 0.75,
        }}
      />
    </AbsoluteFill>
  );
};

/** Logo FIFA World Cup 2026 */
const WC2026Logo: React.FC<{ frame: number }> = ({ frame }) => {
  const opacity = fadeIn(frame, 0, 25);
  const ty = slideUp(frame, 0, 25, 30);

  return (
    <div
      style={{
        opacity,
        translate: `0px ${ty}px`,
        textAlign: "center",
        paddingTop: 80,
      }}
    >
      <div
        style={{
          fontFamily: oswald,
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: 6,
          color: "#c9a84c",
          textTransform: "uppercase",
        }}
      >
        FIFA WORLD CUP
      </div>
      <div
        style={{
          fontFamily: oswald,
          fontWeight: 700,
          fontSize: 80,
          letterSpacing: -2,
          lineHeight: 1,
          background: "linear-gradient(135deg, #f5d06e 0%, #c9a84c 50%, #a07830 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        2026™
      </div>
      <div
        style={{
          fontFamily: roboto,
          fontWeight: 300,
          fontSize: 18,
          letterSpacing: 8,
          color: "rgba(255,255,255,0.5)",
          marginTop: 4,
        }}
      >
        CANADA · MÉXICO · USA
      </div>
    </div>
  );
};

/** Separador dorado */
const GoldDivider: React.FC<{ frame: number; startAt: number }> = ({
  frame,
  startAt,
}) => {
  const scaleX = interpolate(frame, [startAt, startAt + 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });
  const opacity = fadeIn(frame, startAt, 15);

  return (
    <div
      style={{
        opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        margin: "24px 0",
      }}
    >
      <div
        style={{
          height: 2,
          width: 120 * scaleX,
          background: "linear-gradient(90deg, transparent, #c9a84c)",
        }}
      />
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#c9a84c",
          opacity: scaleX,
        }}
      />
      <div
        style={{
          height: 2,
          width: 120 * scaleX,
          background: "linear-gradient(90deg, #c9a84c, transparent)",
        }}
      />
    </div>
  );
};

/** Badge "RESULTADO FINAL" */
const ResultadoBadge: React.FC<{ frame: number; startAt: number }> = ({
  frame,
  startAt,
}) => {
  const opacity = fadeIn(frame, startAt, 20);
  const ty = slideUp(frame, startAt, 20, 20);

  return (
    <div
      style={{
        opacity,
        translate: `0px ${ty}px`,
        textAlign: "center",
        marginBottom: 32,
      }}
    >
      <div
        style={{
          display: "inline-block",
          background: "linear-gradient(135deg, #c9a84c, #f5d06e)",
          padding: "10px 36px",
          borderRadius: 4,
        }}
      >
        <span
          style={{
            fontFamily: oswald,
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: 5,
            color: "#0a0a1a",
            textTransform: "uppercase",
          }}
        >
          Resultado Final
        </span>
      </div>
    </div>
  );
};

/** Tarjeta de un equipo con bandera, nombre y goles */
const TeamCard: React.FC<{
  frame: number;
  startAt: number;
  flag: string;
  name: string;
  score: number;
  color: string;
  side: "left" | "right";
}> = ({ frame, startAt, flag, name, score, color, side }) => {
  const txFlag =
    side === "left"
      ? slideFromLeft(frame, startAt, 30)
      : slideFromRight(frame, startAt, 30);
  const opacityFlag = fadeIn(frame, startAt, 20);

  const scoreStartAt = startAt + 35;
  const opacityScore = fadeIn(frame, scoreStartAt, 20);
  const displayScore = countUp(frame, scoreStartAt, score, 30);

  const isLeft = side === "left";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: 280,
      }}
    >
      {/* Bandera */}
      <div
        style={{
          opacity: opacityFlag,
          translate: `${txFlag}px 0px`,
          fontSize: 96,
          marginBottom: 16,
          filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))",
        }}
      >
        {flag}
      </div>

      {/* Nombre equipo */}
      <div
        style={{
          opacity: opacityFlag,
          translate: `${txFlag}px 0px`,
          fontFamily: oswald,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: 2,
          color: "#ffffff",
          textAlign: "center",
          textTransform: "uppercase",
          textShadow: `0 0 20px ${color}88`,
          marginBottom: 20,
          maxWidth: 260,
        }}
      >
        {name}
      </div>

      {/* Goles */}
      <div
        style={{
          opacity: opacityScore,
          fontFamily: oswald,
          fontWeight: 700,
          fontSize: 120,
          lineHeight: 1,
          color: "#ffffff",
          textShadow: `0 0 40px ${color}, 0 0 80px ${color}66`,
        }}
      >
        {displayScore}
      </div>

      {/* Línea de color del equipo */}
      <div
        style={{
          marginTop: 12,
          width: interpolate(frame, [scoreStartAt, scoreStartAt + 30], [0, 80], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          height: 4,
          borderRadius: 2,
          background: color,
          boxShadow: `0 0 12px ${color}`,
        }}
      />
    </div>
  );
};

/** Separador "VS" central */
const VsSeparator: React.FC<{ frame: number; startAt: number }> = ({
  frame,
  startAt,
}) => {
  const opacity = fadeIn(frame, startAt, 25);
  const scale = interpolate(frame, [startAt, startAt + 25], [0.3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
  });

  return (
    <div
      style={{
        opacity,
        scale: String(scale),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ width: 2, height: 40, background: "rgba(255,255,255,0.15)" }} />
      <div
        style={{
          fontFamily: oswald,
          fontWeight: 400,
          fontSize: 32,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: 2,
        }}
      >
        VS
      </div>
      <div style={{ width: 2, height: 40, background: "rgba(255,255,255,0.15)" }} />
    </div>
  );
};

/** Info del partido (fase, estadio, fecha) */
const MatchInfo: React.FC<{
  frame: number;
  startAt: number;
  matchStage: string;
  venue: string;
  city: string;
  matchDate: string;
}> = ({ frame, startAt, matchStage, venue, city, matchDate }) => {
  const opacity = fadeIn(frame, startAt, 25);
  const ty = slideUp(frame, startAt, 25, 30);

  return (
    <div
      style={{
        opacity,
        translate: `0px ${ty}px`,
        textAlign: "center",
        padding: "0 60px",
      }}
    >
      {/* Fase */}
      <div
        style={{
          fontFamily: oswald,
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: 4,
          color: "#c9a84c",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {matchStage}
      </div>

      {/* Estadio */}
      <div
        style={{
          fontFamily: roboto,
          fontWeight: 300,
          fontSize: 20,
          color: "rgba(255,255,255,0.7)",
          marginBottom: 4,
        }}
      >
        {venue}
      </div>

      {/* Ciudad · Fecha */}
      <div
        style={{
          fontFamily: roboto,
          fontWeight: 300,
          fontSize: 18,
          color: "rgba(255,255,255,0.45)",
          letterSpacing: 1,
        }}
      >
        {city} · {matchDate}
      </div>
    </div>
  );
};

/** Branding del canal */
const ChannelBranding: React.FC<{ frame: number; startAt: number }> = ({
  frame,
  startAt,
}) => {
  const opacity = fadeIn(frame, startAt, 20);
  const ty = slideUp(frame, startAt, 20, 20);

  return (
    <div
      style={{
        opacity,
        translate: `0px ${ty}px`,
        textAlign: "center",
        paddingBottom: 70,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(201,168,76,0.3)",
          padding: "12px 28px",
          borderRadius: 40,
        }}
      >
        <span style={{ fontSize: 22 }}>⚽</span>
        <span
          style={{
            fontFamily: oswald,
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: 3,
            color: "rgba(255,255,255,0.85)",
            textTransform: "uppercase",
          }}
        >
          MUNDIAL 2026 TV
        </span>
      </div>
      <div
        style={{
          fontFamily: roboto,
          fontWeight: 300,
          fontSize: 16,
          color: "rgba(255,255,255,0.35)",
          letterSpacing: 2,
          marginTop: 8,
          textTransform: "uppercase",
        }}
      >
        @eliasvaldivia7233
      </div>
    </div>
  );
};

/** Destellos decorativos */
const Stars: React.FC = () => {
  const frame = useCurrentFrame();

  const positions = [
    { x: 60, y: 180, size: 3, delay: 0 },
    { x: 980, y: 220, size: 2, delay: 20 },
    { x: 140, y: 650, size: 4, delay: 10 },
    { x: 900, y: 700, size: 3, delay: 35 },
    { x: 80, y: 1400, size: 2, delay: 15 },
    { x: 960, y: 1350, size: 3, delay: 25 },
    { x: 500, y: 130, size: 2, delay: 40 },
    { x: 540, y: 1750, size: 3, delay: 5 },
  ];

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {positions.map((p, i) => {
        const pulse = interpolate(
          (frame + p.delay * 5) % 90,
          [0, 45, 90],
          [0.2, 1, 0.2],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: "#c9a84c",
              opacity: pulse * 0.6,
              boxShadow: `0 0 ${p.size * 4}px #c9a84c`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ── Composición principal ─────────────────────────────────────────────────
export const ResultadoShorts: React.FC<ResultadoShortsProps> = (props) => {
  const {
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    homeFlag,
    awayFlag,
    homeColor,
    awayColor,
    matchDate,
    matchStage,
    venue,
    city,
  } = props;

  const frame = useCurrentFrame();

  // Tiempos de animación (en frames a 30fps)
  const T_LOGO = 0;
  const T_DIVIDER1 = 45;
  const T_BADGE = 65;
  const T_TEAMS = 90;
  const T_DIVIDER2 = 155;
  const T_INFO = 175;
  const T_DIVIDER3 = 210;
  const T_BRANDING = 230;

  return (
    <AbsoluteFill style={{ background: "#0a0a1a", overflow: "hidden" }}>
      {/* Fondo gradiente */}
      <Background homeColor={homeColor} awayColor={awayColor} />

      {/* Destellos */}
      <Stars />
      <StudioScoreboard
        frame={frame}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeScore={homeScore}
        awayScore={awayScore}
        homeFlag={homeFlag}
        awayFlag={awayFlag}
      />
      <CommentatorDesk frame={frame} />

      {/* Líneas decorativas laterales */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "15%",
            bottom: "15%",
            width: 3,
            background: `linear-gradient(to bottom, transparent, ${homeColor}66, transparent)`,
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "15%",
            bottom: "15%",
            width: 3,
            background: `linear-gradient(to bottom, transparent, ${awayColor}66, transparent)`,
            opacity: 0.6,
          }}
        />
      </AbsoluteFill>

      {/* Layout vertical centrado */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* LOGO */}
        <WC2026Logo frame={frame} />

        {/* CONTENIDO CENTRAL */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <GoldDivider frame={frame} startAt={T_DIVIDER1} />
          <ResultadoBadge frame={frame} startAt={T_BADGE} />

          {/* Equipos y marcador */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              width: "100%",
              paddingBottom: 8,
            }}
          >
            <TeamCard
              frame={frame}
              startAt={T_TEAMS}
              flag={homeFlag}
              name={homeTeam}
              score={homeScore}
              color={homeColor}
              side="left"
            />
            <VsSeparator frame={frame} startAt={T_TEAMS + 10} />
            <TeamCard
              frame={frame}
              startAt={T_TEAMS}
              flag={awayFlag}
              name={awayTeam}
              score={awayScore}
              color={awayColor}
              side="right"
            />
          </div>

          <GoldDivider frame={frame} startAt={T_DIVIDER2} />

          {/* Info del partido */}
          <MatchInfo
            frame={frame}
            startAt={T_INFO}
            matchStage={matchStage}
            venue={venue}
            city={city}
            matchDate={matchDate}
          />
        </div>

        {/* BRANDING CANAL */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <GoldDivider frame={frame} startAt={T_DIVIDER3} />
          <ChannelBranding frame={frame} startAt={T_BRANDING} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
