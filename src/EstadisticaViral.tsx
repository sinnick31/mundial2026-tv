import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadRoboto } from "@remotion/google-fonts/Roboto";

const { fontFamily: oswald } = loadOswald("normal", { weights: ["400", "700"], subsets: ["latin"] });
const { fontFamily: roboto } = loadRoboto("normal", { weights: ["300", "400", "700"], subsets: ["latin"] });

export interface EstadisticaViralProps {
  emoji: string;
  bigNumber: string;
  bigLabel: string;
  title: string;
  description: string;
  context: string;
  accentColor: string;
  teamFlag?: string;
  teamName?: string;
  category: string;
}

export const defaultEstadisticaProps: EstadisticaViralProps = {
  emoji: "🔥",
  bigNumber: "8",
  bigLabel: "GOLES SIN RESPUESTA",
  title: "BRASIL APLASTA AL MUNDO",
  description: "Brasil no ha recibido un solo gol en sus últimos 3 partidos del Mundial 2026.",
  context: "La última vez que esto pasó fue en 2002, cuando ganaron el torneo.",
  accentColor: "#009c3b",
  teamFlag: "🇧🇷",
  teamName: "BRASIL",
  category: "DATO VIRAL DEL DÍA",
};

const ei = (frame: number, s: number, e: number, os: number, oe: number, ease = Easing.bezier(0.16, 1, 0.3, 1)) =>
  interpolate(frame, [s, e], [os, oe], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

export const EstadisticaViral: React.FC<EstadisticaViralProps> = (props) => {
  const { emoji, bigNumber, bigLabel, title, description, context, accentColor, teamFlag, teamName, category } = props;
  const frame = useCurrentFrame();
  const spring = Easing.bezier(0.34, 1.56, 0.64, 1);

  // Parse bigNumber para animar si es numérico
  const isNumeric = !isNaN(Number(bigNumber));
  const animatedNumber = isNumeric
    ? Math.round(ei(frame, 60, 100, 0, Number(bigNumber))).toString()
    : bigNumber;

  return (
    <AbsoluteFill style={{
      background: `
        radial-gradient(ellipse at 50% 30%, ${accentColor}33 0%, transparent 60%),
        linear-gradient(170deg, #080810 0%, #0c0c1a 60%, #080810 100%)
      `,
      overflow: "hidden",
    }}>

      {/* Círculo decorativo de fondo */}
      <div style={{
        position: "absolute",
        top: "15%", left: "50%",
        width: 700, height: 700,
        borderRadius: "50%",
        border: `1px solid ${accentColor}18`,
        transform: "translateX(-50%)",
        opacity: ei(frame, 0, 40, 0, 1),
      }} />
      <div style={{
        position: "absolute",
        top: "15%", left: "50%",
        width: 500, height: 500,
        borderRadius: "50%",
        border: `1px solid ${accentColor}25`,
        transform: "translateX(-50%)",
        opacity: ei(frame, 10, 50, 0, 1),
      }} />

      <AbsoluteFill style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "space-between",
        padding: "80px 0 70px",
      }}>
        {/* TOP: Categoría */}
        <div style={{
          opacity: ei(frame, 0, 20, 0, 1),
          translate: `0px ${ei(frame, 0, 20, -20, 0)}px`,
          textAlign: "center",
        }}>
          <div style={{
            display: "inline-block",
            background: `${accentColor}22`,
            border: `1px solid ${accentColor}66`,
            padding: "10px 28px", borderRadius: 40,
          }}>
            <span style={{
              fontFamily: oswald, fontWeight: 700, fontSize: 18,
              letterSpacing: 4, color: accentColor, textTransform: "uppercase",
            }}>
              📊 {category}
            </span>
          </div>
          <div style={{
            fontFamily: roboto, fontWeight: 300, fontSize: 17,
            color: "rgba(255,255,255,0.35)", letterSpacing: 3,
            marginTop: 8, textTransform: "uppercase",
          }}>
            FIFA World Cup 2026™
          </div>
        </div>

        {/* MIDDLE: Big stat */}
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", gap: 16, width: "100%",
        }}>
          {/* Emoji + Flag */}
          <div style={{
            opacity: ei(frame, 20, 45, 0, 1),
            scale: String(ei(frame, 20, 45, 0.3, 1, spring)),
            fontSize: 80,
            filter: `drop-shadow(0 0 30px ${accentColor})`,
          }}>
            {teamFlag || emoji}
          </div>

          {teamName && (
            <div style={{
              opacity: ei(frame, 30, 50, 0, 1),
              fontFamily: oswald, fontWeight: 700, fontSize: 34,
              color: "#fff", letterSpacing: 3,
              textShadow: `0 0 20px ${accentColor}`,
            }}>
              {teamName}
            </div>
          )}

          {/* Big Number */}
          <div style={{
            opacity: ei(frame, 50, 70, 0, 1),
            scale: String(ei(frame, 50, 70, 0.5, 1, spring)),
            textAlign: "center",
          }}>
            <div style={{
              fontFamily: oswald, fontWeight: 700,
              fontSize: animatedNumber.length > 4 ? 120 : 180,
              lineHeight: 1,
              background: `linear-gradient(135deg, #ffffff, ${accentColor})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: `drop-shadow(0 0 40px ${accentColor}88)`,
            }}>
              {animatedNumber}
            </div>
            <div style={{
              fontFamily: oswald, fontWeight: 700, fontSize: 26,
              letterSpacing: 4, color: accentColor,
              textTransform: "uppercase", marginTop: -8,
              opacity: ei(frame, 65, 85, 0, 1),
            }}>
              {bigLabel}
            </div>
          </div>

          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, margin: "8px 0",
            opacity: ei(frame, 80, 95, 0, 1),
          }}>
            <div style={{ height: 1, width: ei(frame, 80, 105, 0, 120), background: `linear-gradient(90deg, transparent, ${accentColor})` }} />
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: accentColor }} />
            <div style={{ height: 1, width: ei(frame, 80, 105, 0, 120), background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
          </div>

          {/* Title */}
          <div style={{
            opacity: ei(frame, 90, 110, 0, 1),
            translate: `0px ${ei(frame, 90, 110, 20, 0)}px`,
            fontFamily: oswald, fontWeight: 700, fontSize: 38,
            color: "#fff", textAlign: "center",
            padding: "0 50px", lineHeight: 1.2,
          }}>
            {title}
          </div>

          {/* Description */}
          <div style={{
            opacity: ei(frame, 105, 125, 0, 1),
            translate: `0px ${ei(frame, 105, 125, 15, 0)}px`,
            fontFamily: roboto, fontWeight: 400, fontSize: 22,
            color: "rgba(255,255,255,0.75)", textAlign: "center",
            padding: "0 60px", lineHeight: 1.5,
          }}>
            {description}
          </div>

          {/* Context */}
          <div style={{
            opacity: ei(frame, 120, 140, 0, 1),
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${accentColor}33`,
            borderRadius: 10, padding: "14px 24px",
            margin: "0 50px",
          }}>
            <span style={{
              fontFamily: roboto, fontWeight: 300, fontSize: 18,
              color: "rgba(255,255,255,0.5)", fontStyle: "italic",
              lineHeight: 1.5,
            }}>
              💡 {context}
            </span>
          </div>
        </div>

        {/* BOTTOM: Branding */}
        <div style={{
          opacity: ei(frame, 150, 170, 0, 1),
          translate: `0px ${ei(frame, 150, 170, 20, 0)}px`,
          textAlign: "center",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(201,168,76,0.3)",
            padding: "12px 28px", borderRadius: 40,
          }}>
            <span style={{ fontSize: 20 }}>⚽</span>
            <span style={{
              fontFamily: oswald, fontWeight: 700, fontSize: 20,
              letterSpacing: 3, color: "rgba(255,255,255,0.85)",
            }}>MUNDIAL 2026 TV</span>
          </div>
          <div style={{
            fontFamily: roboto, fontWeight: 300, fontSize: 15,
            color: "rgba(255,255,255,0.3)", letterSpacing: 2,
            marginTop: 6,
          }}>@eliasvaldivia7233</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
