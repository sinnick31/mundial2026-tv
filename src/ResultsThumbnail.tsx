import React from 'react';
import { AbsoluteFill } from 'remotion';

export type ResultsThumbnailProps = { date: string; count: number };

export const ResultsThumbnail: React.FC<ResultsThumbnailProps> = ({ date, count }) => (
  <AbsoluteFill style={{
    background: 'linear-gradient(120deg, #06101d 0%, #122a43 58%, #07111f 100%)',
    color: '#fff',
    fontFamily: 'Arial, Helvetica, sans-serif',
    overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 26, background: '#e11d2e' }} />
    <div style={{ position: 'absolute', right: -90, top: -160, width: 520, height: 520, borderRadius: 260, border: '42px solid rgba(255,255,255,0.06)' }} />
    <div style={{ position: 'absolute', right: 95, top: 105, fontSize: 150, opacity: 0.95 }}>⚽</div>
    <div style={{ position: 'absolute', left: 76, top: 62, fontSize: 25, fontWeight: 900, letterSpacing: 5, color: '#ff4050' }}>REAL FOOTBALL NEWSROOM</div>
    <div style={{ position: 'absolute', left: 72, top: 150, fontSize: 82, lineHeight: 0.98, fontWeight: 1000, letterSpacing: -2, maxWidth: 930 }}>
      RESULTADOS<br />DEL FÚTBOL
    </div>
    <div style={{ position: 'absolute', left: 78, top: 365, background: '#e11d2e', padding: '14px 22px', borderRadius: 7, fontSize: 27, fontWeight: 900, letterSpacing: 2 }}>
      CHILE + MUNDO
    </div>
    <div style={{ position: 'absolute', left: 78, bottom: 67, fontSize: 28, color: '#d5e2ef', fontWeight: 700 }}>
      {date}  ·  {count} {count === 1 ? 'PARTIDO' : 'PARTIDOS'} VERIFICADOS
    </div>
    <div style={{ position: 'absolute', right: 52, bottom: 47, fontSize: 19, color: '#91a9c1', letterSpacing: 2 }}>FÚTBOL SIN HUMO</div>
  </AbsoluteFill>
);
