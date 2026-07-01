import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

export interface PrediccionProps {
  gancho: string;        // "¡ARGENTINA ELIMINADA!"
  subtitulo: string;     // "Esta es mi predicción del Mundial 2026"
  descripcion: string;   // Predicción generada por Gemini
  equipo1: string;       // "Argentina"
  equipo2?: string;      // "Francia" (opcional)
  probabilidad: number;  // 0-100
  puntos: string[];      // ["Razón 1", "Razón 2", "Razón 3"]
  emoji: string;         // "⚽"
  tipo: 'eliminacion' | 'campeon' | 'sorpresa' | 'fracaso';
  /** Clip de stock real (public/broll/...) — opcional, hace que se vea como contenido real */
  brollSrc?: string;
  /** .wav generado por scripts/generate-narration.js — opcional, le da voz al video */
  audioSrc?: string;
}

const COLORES = {
  eliminacion: { bg: '#0d0000', acento: '#ff1a1a', acento2: '#ff6b00' },
  campeon:     { bg: '#000d00', acento: '#00cc44', acento2: '#ffe600' },
  sorpresa:    { bg: '#00001a', acento: '#6600ff', acento2: '#00ccff' },
  fracaso:     { bg: '#0d0500', acento: '#ff6b00', acento2: '#ff1a1a' },
};

// ─── Capa de video real de fondo (stock libre de copyright) ──────────────────
const BrollLayer: React.FC<{ brollSrc?: string; opacity?: number }> = ({ brollSrc, opacity = 0.34 }) => {
  if (!brollSrc) return null;
  return (
    <AbsoluteFill style={{ opacity }}>
      <OffthreadVideo
        src={brollSrc.startsWith('http') ? brollSrc : staticFile(brollSrc)}
            muted
        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.2) contrast(1.05)' }}
      />
    </AbsoluteFill>
  );
};

// ─── Fase 1: HOOK (0–2s) ─────────────────────────────────────────────────────
const HookPhase: React.FC<{ gancho: string; subtitulo: string; tipo: PrediccionProps['tipo']; emoji: string; brollSrc?: string }> = ({
  gancho, subtitulo, tipo, emoji, brollSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colores = COLORES[tipo];

  const scale = spring({ frame, fps, config: { damping: 10, stiffness: 180 } });
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const shakeX = frame < 10 ? Math.sin(frame * 3.5) * 6 * (1 - frame / 10) : 0;

  const subtitleOpacity = interpolate(frame, [15, 25], [0, 1], { extrapolateRight: 'clamp' });
  const subtitleY = interpolate(frame, [15, 25], [20, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });

  const pulseScale = 1 + Math.sin(frame * 0.4) * 0.015;

  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${colores.bg}dd 0%, #000000 70%)` }}>
      <BrollLayer brollSrc={brollSrc} opacity={0.25} />
      {/* Líneas de energía de fondo */}
      <AbsoluteFill style={{ opacity: 0.15 }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: '2px',
            height: '60%',
            background: `linear-gradient(to top, transparent, ${colores.acento})`,
            transform: `rotate(${i * 45}deg) translateY(-50%)`,
            transformOrigin: '50% 100%',
            opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
          }} />
        ))}
      </AbsoluteFill>

      {/* Emoji grande de fondo */}
      <AbsoluteFill style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 380, opacity: 0.06,
        transform: `scale(${pulseScale})`,
      }}>
        {emoji}
      </AbsoluteFill>

      {/* TEXTO PRINCIPAL — GANCHO */}
      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 40px',
      }}>
        <div style={{
          opacity,
          transform: `scale(${scale}) translateX(${shakeX}px)`,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: gancho.length > 20 ? 88 : 104,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 0.95,
            letterSpacing: '-2px',
            textTransform: 'uppercase',
            textShadow: `0 0 40px ${colores.acento}, 0 0 80px ${colores.acento}88, 4px 4px 0px ${colores.acento}`,
            fontFamily: "'Arial Black', 'Impact', sans-serif",
          }}>
            {gancho}
          </div>

          {/* Línea decorativa */}
          <div style={{
            height: 5, borderRadius: 3, margin: '20px auto',
            width: `${interpolate(frame, [10, 30], [0, 80], { extrapolateRight: 'clamp' })}%`,
            background: `linear-gradient(90deg, transparent, ${colores.acento}, ${colores.acento2}, ${colores.acento}, transparent)`,
          }} />
        </div>

        {/* SUBTÍTULO */}
        <div style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          fontSize: 38,
          fontWeight: 700,
          color: '#ffffffcc',
          textAlign: 'center',
          lineHeight: 1.25,
          marginTop: 10,
          fontFamily: "'Arial', sans-serif",
          padding: '0 20px',
          textShadow: '0 2px 10px rgba(0,0,0,0.8)',
        }}>
          {subtitulo}
        </div>
      </AbsoluteFill>

      {/* MUNDIAL 2026 badge top */}
      <div style={{
        position: 'absolute', top: 60, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
        opacity: interpolate(frame, [5, 20], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        <div style={{
          background: colores.acento,
          color: '#000',
          padding: '8px 28px',
          borderRadius: 99,
          fontSize: 22,
          fontWeight: 900,
          letterSpacing: 1,
          fontFamily: "'Arial Black', sans-serif",
        }}>
          ⚽ MUNDIAL 2026
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Cabecera + descripción + barra (parte fija del contenido) ───────────────
const HeaderBlock: React.FC<{
  descripcion: string; equipo1: string; equipo2?: string;
  probabilidad: number; tipo: PrediccionProps['tipo'];
}> = ({ descripcion, equipo1, equipo2, probabilidad, tipo }) => {
  const frame = useCurrentFrame();
  const colores = COLORES[tipo];
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const barWidth = interpolate(frame, [20, 80], [0, probabilidad], {
    extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{
      padding: '60px 36px 0', display: 'flex', flexDirection: 'column', gap: 28,
    }}>
      <div style={{
        opacity: headerOpacity,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 20,
          fontSize: 56, fontWeight: 900, color: '#fff',
          fontFamily: "'Arial Black', sans-serif",
        }}>
          <span>{equipo1}</span>
          {equipo2 && <>
            <span style={{ color: colores.acento, fontSize: 44 }}>vs</span>
            <span>{equipo2}</span>
          </>}
        </div>
        <div style={{ width: '100%', height: 3, background: `linear-gradient(90deg, transparent, ${colores.acento}, transparent)` }} />
      </div>

      <div style={{
        fontSize: 36, color: '#ffffffdd', lineHeight: 1.45,
        fontFamily: "'Arial', sans-serif", fontWeight: 500, textAlign: 'center',
        opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateRight: 'clamp' }),
      }}>
        {descripcion}
      </div>

      <div style={{ opacity: interpolate(frame, [15, 35], [0, 1], { extrapolateRight: 'clamp' }) }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginBottom: 10,
          fontSize: 26, fontWeight: 700, color: '#ffffffaa', fontFamily: "'Arial', sans-serif",
        }}>
          <span>Probabilidad según la IA</span>
          <span style={{ color: colores.acento }}>{Math.round(barWidth)}%</span>
        </div>
        <div style={{ width: '100%', height: 18, background: '#ffffff15', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            width: `${barWidth}%`, height: '100%', borderRadius: 99,
            background: `linear-gradient(90deg, ${colores.acento}, ${colores.acento2})`,
            boxShadow: `0 0 20px ${colores.acento}88`,
          }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Un punto clave a pantalla completa (reemplaza la lista numerada) ────────
const PuntoFullscreen: React.FC<{
  punto: string; index: number; total: number; tipo: PrediccionProps['tipo']; brollSrc?: string;
}> = ({ punto, index, total, tipo, brollSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colores = COLORES[tipo];

  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const slideX = interpolate(frame, [0, 12], [40, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ background: '#050505' }}>
      <BrollLayer brollSrc={brollSrc} opacity={0.3} />
      <AbsoluteFill style={{
        background: `linear-gradient(180deg, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.85) 100%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 60px',
      }}>
        <div style={{
          fontSize: 24, fontWeight: 900, color: colores.acento, letterSpacing: 3,
          fontFamily: "'Arial Black', sans-serif", opacity, marginBottom: 22,
        }}>
          RAZÓN {index + 1}/{total}
        </div>
        <div style={{
          opacity, transform: `scale(${scale}) translateX(${slideX}px)`,
          fontSize: 46, fontWeight: 800, color: '#fff', textAlign: 'center',
          lineHeight: 1.2, fontFamily: "'Arial Black', sans-serif",
          textShadow: `0 0 30px ${colores.acento}55`,
        }}>
          {punto}
        </div>
        <div style={{
          display: 'flex', gap: 8, marginTop: 36,
          opacity: interpolate(frame, [8, 18], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              width: i === index ? 28 : 10, height: 10, borderRadius: 99,
              background: i === index ? colores.acento : '#ffffff30',
            }} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Fase 2: CONTENIDO (header fijo + puntos a pantalla completa) ────────────
const ContentPhase: React.FC<{
  descripcion: string; equipo1: string; equipo2?: string;
  probabilidad: number; puntos: string[]; tipo: PrediccionProps['tipo'];
  durationInFrames: number; brollSrc?: string;
}> = ({ descripcion, equipo1, equipo2, probabilidad, puntos, tipo, durationInFrames, brollSrc }) => {
  const HEADER_FRAMES = Math.round(durationInFrames * 0.34);
  const puntosFrames = Math.max(durationInFrames - HEADER_FRAMES, 30);
  const perPunto = Math.max(Math.floor(puntosFrames / Math.max(puntos.length, 1)), 20);

  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={HEADER_FRAMES}>
        <AbsoluteFill style={{ background: `linear-gradient(180deg, #050505 0%, #0a0a0a 100%)` }}>
          <BrollLayer brollSrc={brollSrc} opacity={0.22} />
          <HeaderBlock
            descripcion={descripcion} equipo1={equipo1} equipo2={equipo2}
            probabilidad={probabilidad} tipo={tipo}
          />
          <div style={{
            position: 'absolute', bottom: 50, left: 0, right: 0, textAlign: 'center',
            fontSize: 22, color: '#ffffff66', fontFamily: "'Arial', sans-serif",
          }}>
            🤖 Predicción generada por Inteligencia Artificial
          </div>
        </AbsoluteFill>
      </Sequence>

      {puntos.map((punto, i) => (
        <Sequence key={i} from={HEADER_FRAMES + i * perPunto} durationInFrames={perPunto}>
          <PuntoFullscreen punto={punto} index={i} total={puntos.length} tipo={tipo} brollSrc={brollSrc} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ─── Fase 3: CTA ──────────────────────────────────────────────────────────────
const CTAPhase: React.FC<{ tipo: PrediccionProps['tipo'] }> = ({ tipo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colores = COLORES[tipo];

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });
  const pulse = 1 + Math.sin(frame * 0.2) * 0.04;

  const siOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: 'clamp' });
  const noOpacity = interpolate(frame, [30, 45], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(180deg, #000000 0%, #050510 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 40, padding: '0 40px',
    }}>
      <div style={{ transform: `scale(${scale})`, textAlign: 'center' }}>
        <div style={{
          fontSize: 62, fontWeight: 900, color: '#ffffff',
          lineHeight: 1.1, fontFamily: "'Arial Black', sans-serif",
          textShadow: `0 0 30px ${colores.acento}66`,
        }}>
          ¿Crees que esto pasará?
        </div>
        <div style={{ fontSize: 38, color: '#ffffffaa', marginTop: 12, fontFamily: "'Arial', sans-serif" }}>
          Deja tu predicción en los comentarios 👇
        </div>
      </div>

      <div style={{ display: 'flex', gap: 30, transform: `scale(${pulse})` }}>
        <div style={{
          opacity: siOpacity, background: '#00cc44', borderRadius: 20, padding: '28px 52px',
          fontSize: 64, fontWeight: 900, color: '#000', fontFamily: "'Arial Black', sans-serif",
          boxShadow: '0 0 40px #00cc4488',
        }}>✅ SI</div>
        <div style={{
          opacity: noOpacity, background: '#ff1a1a', borderRadius: 20, padding: '28px 52px',
          fontSize: 64, fontWeight: 900, color: '#fff', fontFamily: "'Arial Black', sans-serif",
          boxShadow: '0 0 40px #ff1a1a88',
        }}>❌ NO</div>
      </div>

      <div style={{ opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateRight: 'clamp' }), textAlign: 'center' }}>
        <div style={{ fontSize: 30, color: colores.acento, fontWeight: 700, fontFamily: "'Arial', sans-serif" }}>
          🔔 Síguenos para más predicciones del Mundial 2026
        </div>
        <div style={{ fontSize: 26, color: '#ffffff66', marginTop: 8, fontFamily: "'Arial', sans-serif" }}>
          @MUNDIAL2026TV
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Composición principal ────────────────────────────────────────────────────
export const PrediccionShorts: React.FC<PrediccionProps> = (props) => {
  const { fps, durationInFrames } = useVideoConfig();

  // La duración total ahora puede venir del largo real de la narración
  // (--duration-in-frames la sobreescribe en el render). Estas fases
  // se reparten proporcionalmente en vez de usar segundos fijos.
  const HOOK_END = Math.min(2 * fps, Math.round(durationInFrames * 0.12));
  const CTA_FRAMES = Math.min(5 * fps, Math.round(durationInFrames * 0.2));
  const CONTENT_END = Math.max(durationInFrames - CTA_FRAMES, HOOK_END + 30);

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {props.audioSrc && (
        <Audio src={props.audioSrc.startsWith('http') ? props.audioSrc : staticFile(props.audioSrc)} />
      )}

      <Sequence from={0} durationInFrames={HOOK_END}>
        <HookPhase
          gancho={props.gancho} subtitulo={props.subtitulo}
          tipo={props.tipo} emoji={props.emoji} brollSrc={props.brollSrc}
        />
      </Sequence>

      <Sequence from={HOOK_END} durationInFrames={CONTENT_END - HOOK_END}>
        <ContentPhase
          descripcion={props.descripcion} equipo1={props.equipo1} equipo2={props.equipo2}
          probabilidad={props.probabilidad} puntos={props.puntos} tipo={props.tipo}
          durationInFrames={CONTENT_END - HOOK_END} brollSrc={props.brollSrc}
        />
      </Sequence>

      <Sequence from={CONTENT_END} durationInFrames={durationInFrames - CONTENT_END}>
        <CTAPhase tipo={props.tipo} />
      </Sequence>
    </AbsoluteFill>
  );
};
