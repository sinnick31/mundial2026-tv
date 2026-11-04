import React from 'react';
import { AbsoluteFill, Img } from 'remotion';

export type VideoThumbnailProps = {
  headline: string;
  section?: string;
  team1?: string;
  team2?: string;
  team1Image?: string;
  team2Image?: string;
  source?: string;
  date?: string;
};

const short = (value = '', max = 76) => value.length > max ? value.slice(0, max - 1).trimEnd() + '…' : value;
const initials = (value = '?') => value.split(/\\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase();

const ClubVisual: React.FC<{ name?: string; image?: string; side: 'left' | 'right' }> = ({ name, image, side }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, width: 180, minWidth: 0 }}>
    {image && /^https:\\/\\//i.test(image)
      ? <Img src={image} style={{ width: 112, height: 112, objectFit: 'contain', background: '#fff', borderRadius: 18, padding: 8 }} />
      : <div style={{ width: 112, height: 112, borderRadius: 56, background: 'linear-gradient(145deg,#fff,#b8c4d2)', color: '#101827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 900 }}>{initials(name || (side === 'left' ? 'FC' : 'CLUB'))}</div>}
    <div style={{ color: '#fff', fontSize: 20, lineHeight: 1.1, fontWeight: 900, textAlign: 'center' }}>{short(name || '', 22)}</div>
  </div>
);

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  headline, section = 'FÚTBOL CHILENSIS', team1, team2, team1Image, team2Image, source, date,
}) => (
  <AbsoluteFill style={{ background: 'linear-gradient(125deg,#080d16 0%,#14243a 55%,#080d16 100%)', color: '#fff', fontFamily: 'Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 20%,rgba(230,30,45,.28),transparent 42%)' }} />
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 20, background: '#ed1c2e' }} />
    <div style={{ position: 'absolute', right: -130, top: -190, width: 600, height: 600, borderRadius: 300, border: '36px solid rgba(255,255,255,.07)' }} />
    <div style={{ position: 'absolute', left: 66, right: 66, top: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
        <div style={{ width: 54, height: 54, borderRadius: 12, background: '#ed1c2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 25, fontWeight: 1000 }}>FC</div>
        <div style={{ fontSize: 27, fontWeight: 1000, letterSpacing: 2 }}>FÚTBOL CHILENSIS</div>
      </div>
      <div style={{ background: '#ed1c2e', padding: '11px 18px', borderRadius: 6, fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>{short(section.toUpperCase(), 28)}</div>
    </div>
    <div style={{ position: 'absolute', left: 72, top: 190, width: 790, fontSize: 66, lineHeight: 1.02, fontWeight: 1000, letterSpacing: -1, textShadow: '0 4px 18px rgba(0,0,0,.65)' }}>{short(headline.toUpperCase(), 68)}</div>
    <div style={{ position: 'absolute', right: 75, top: 190, display: 'flex', alignItems: 'center', gap: 12 }}>
      {team1 ? <ClubVisual name={team1} image={team1Image} side="left" /> : null}
      {team1 && team2 ? <div style={{ fontSize: 34, color: '#ed1c2e', fontWeight: 1000 }}>VS</div> : null}
      {team2 ? <ClubVisual name={team2} image={team2Image} side="right" /> : null}
    </div>
    <div style={{ position: 'absolute', left: 72, right: 72, bottom: 54, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid rgba(255,255,255,.22)', paddingTop: 18 }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#dce5ef', letterSpacing: 1 }}>NOTICIAS · RESULTADOS · TABLAS · ANÁLISIS</div>
      <div style={{ fontSize: 15, color: '#aab8c8', fontWeight: 700 }}>{short(source || 'FUENTES EN LA DESCRIPCIÓN', 36)} {date ? ' · ' + date : ''}</div>
    </div>
  </AbsoluteFill>
);
