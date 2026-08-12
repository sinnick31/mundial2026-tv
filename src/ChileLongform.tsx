import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate } from 'remotion';

export interface ChileLongformSection {
  orden: number;
  titulo: string;
  cuerpo: string;
  fuente: string;
  url: string;
}

export interface ChileLongformProps {
  title: string;
  intro: string;
  sections: ChileLongformSection[];
  audioSrc?: string;
  fuente?: string;
}

const clamp = (s: string, n: number) => (s || '').length > n ? `${s.slice(0, n - 1)}…` : s;

export const ChileLongform: React.FC<ChileLongformProps> = ({ title, intro, sections, audioSrc, fuente }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  const safeSections = sections?.length ? sections : [];
  const slot = Math.max(1, Math.floor(900));
  const active = Math.min(safeSections.length - 1, Math.max(0, Math.floor(frame / slot)));
  const current = safeSections[active] || { orden: 1, titulo: 'Resumen', cuerpo: intro, fuente: fuente || 'Fuentes del día', url: '' };

  return (
    <AbsoluteFill style={{ backgroundColor: '#111', color: '#fff', fontFamily: 'Arial, Helvetica, sans-serif', opacity }}>
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}
      <div style={{ position: 'absolute', inset: 0, padding: 70, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.7 }}>REAL FOOTBALL NEWSROOM</div>
          <div style={{ fontSize: 58, lineHeight: 1.06, fontWeight: 900, marginTop: 20, maxWidth: 1650 }}>{clamp(title, 115)}</div>
          <div style={{ fontSize: 27, lineHeight: 1.35, marginTop: 30, maxWidth: 1500, opacity: 0.86 }}>{clamp(intro, 280)}</div>
        </div>

        <div style={{ display: 'flex', gap: 26, alignItems: 'stretch' }}>
          <div style={{ width: 105, borderRadius: 24, background: '#f2f2f2', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 900 }}>
            {String(current.orden).padStart(2, '0')}
          </div>
          <div style={{ flex: 1, borderRadius: 28, padding: 35, background: '#1e1e1e', border: '1px solid #404040' }}>
            <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.1 }}>{clamp(current.titulo, 100)}</div>
            <div style={{ fontSize: 25, lineHeight: 1.35, marginTop: 20, color: '#ddd' }}>{clamp(current.cuerpo, 360)}</div>
            <div style={{ marginTop: 22, fontSize: 19, color: '#aaa' }}>Fuente: {clamp(current.fuente, 80)}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, color: '#aaa' }}>
          <span>Fuentes enlazadas en la descripción</span>
          <span>{Math.min(active + 1, Math.max(1, safeSections.length))}/{Math.max(1, safeSections.length)}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
