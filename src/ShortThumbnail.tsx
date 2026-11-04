import React from 'react';
import { AbsoluteFill, Img } from 'remotion';

export type ShortThumbnailProps = {
  headline: string;
  section?: string;
  team1?: string;
  team2?: string;
  team1Image?: string;
  team2Image?: string;
  source?: string;
  date?: string;
};

const initials = (value = '?') => value.split(' ').filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase();
const trim = (value = '', max = 54) => value.length > max ? value.slice(0, max - 1).trimEnd() + '…' : value;

const Badge: React.FC<{ name?: string; image?: string }> = ({ name, image }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 230, gap: 14 }}>
    {image && image.startsWith('https://')
      ? <Img src={image} style={{ width: 170, height: 170, objectFit: 'contain', background: '#fff', borderRadius: 28, padding: 12 }} />
      : <div style={{ width: 170, height: 170, borderRadius: 85, background: 'linear-gradient(145deg,#fff,#bac5d3)', color: '#101827', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, fontWeight: 900 }}>{initials(name || 'FC')}</div>}
    <div style={{ color: '#fff', fontSize: 27, fontWeight: 900, textAlign: 'center', lineHeight: 1.1 }}>{trim(name || '', 20)}</div>
  </div>
);

export const ShortThumbnail: React.FC<ShortThumbnailProps> = ({ headline, section = 'FÚTBOL CHILENSIS', team1, team2, team1Image, team2Image, source, date }) => (
  <AbsoluteFill style={{ background: 'linear-gradient(145deg,#080d16 0%,#14243a 52%,#080d16 100%)', color: '#fff', fontFamily: 'Arial, Helvetica, sans-serif', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 25%,rgba(237,28,46,.3),transparent 48%)' }} />
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 24, background: '#ed1c2e' }} />
    <div style={{ position: 'absolute', right: -210, top: 360, width: 650, height: 650, borderRadius: 325, border: '42px solid rgba(255,255,255,.06)' }} />
    <div style={{ position: 'absolute', left: 62, right: 62, top: 82, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 72, height: 72, borderRadius: 16, background: '#ed1c2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 1000 }}>FC</div>
        <div style={{ fontSize: 32, fontWeight: 1000, letterSpacing: 2 }}>FÚTBOL CHILENSIS</div>
      </div>
    </div>
    <div style={{ position: 'absolute', left: 62, right: 62, top: 250, background: '#ed1c2e', padding: '14px 20px', borderRadius: 8, fontSize: 25, fontWeight: 900, letterSpacing: 3, textAlign: 'center' }}>{trim(section.toUpperCase(), 32)}</div>
    <div style={{ position: 'absolute', left: 62, right: 62, top: 390, fontSize: 78, lineHeight: 1.04, fontWeight: 1000, letterSpacing: -1, textAlign: 'center', textShadow: '0 5px 24px rgba(0,0,0,.75)' }}>{trim(headline.toUpperCase(), 58)}</div>
    {(team1 || team2) ? <div style={{ position: 'absolute', left: 80, right: 80, top: 930, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 30 }}>
      {team1 ? <Badge name={team1} image={team1Image} /> : null}
      {team1 && team2 ? <div style={{ fontSize: 50, fontWeight: 1000, color: '#ed1c2e' }}>VS</div> : null}
      {team2 ? <Badge name={team2} image={team2Image} /> : null}
    </div> : <div style={{ position: 'absolute', left: 120, right: 120, top: 1040, height: 310, borderRadius: 24, border: '2px solid rgba(237,28,46,.65)', background: 'linear-gradient(135deg,rgba(237,28,46,.2),rgba(255,255,255,.04))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, fontWeight: 1000, textAlign: 'center' }}>CHILE Y EL MUNDO</div>}
    <div style={{ position: 'absolute', left: 62, right: 62, bottom: 100, borderTop: '3px solid rgba(255,255,255,.24)', paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
      <div style={{ fontSize: 23, fontWeight: 900, letterSpacing: 2 }}>NOTICIAS · RESULTADOS · TABLAS · ANÁLISIS</div>
      <div style={{ fontSize: 18, color: '#b7c5d5', fontWeight: 700 }}>{trim(source || 'FUENTES EN LA DESCRIPCIÓN', 42)} {date ? ' · ' + date : ''}</div>
    </div>
  </AbsoluteFill>
);
