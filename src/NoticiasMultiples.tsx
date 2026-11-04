import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame } from 'remotion';

export type MultipleNewsItem = {
  title: string;
  subtitle: string;
  body: string;
  imageUrl?: string;
  source: string;
  sourceDate: string;
  team?: string;
  score?: string;
  frames: number;
};

export type MultipleNewsProps = {
  items: MultipleNewsItem[];
  audioSrc?: string;
  channelLabel?: string;
};

const clamp = (value: string, max: number) => value.length > max ? value.slice(0, max - 1) + '…' : value;

export const NoticiasMultiples: React.FC<MultipleNewsProps> = ({ items, audioSrc, channelLabel = 'FÚTBOL CHILENSIS' }) => {
  const frame = useCurrentFrame();
  const safeItems = Array.isArray(items) ? items.filter(item => item && item.title && item.body && item.frames > 0) : [];
  const totalFrames = safeItems.reduce((sum, item) => sum + item.frames, 0);
  let elapsed = 0;
  let activeIndex = 0;
  for (let i = 0; i < safeItems.length; i++) {
    if (frame < elapsed + safeItems[i].frames) { activeIndex = i; break; }
    elapsed += safeItems[i].frames;
    activeIndex = Math.min(i + 1, safeItems.length - 1);
  }
  const current = safeItems[activeIndex];
  const localFrame = frame - elapsed;
  const progress = totalFrames > 0 ? Math.min(100, (frame / totalFrames) * 100) : 0;
  if (!current) {
    return <AbsoluteFill style={{background:'#101827',color:'#fff',justifyContent:'center',alignItems:'center',fontFamily:'Arial',fontSize:54,fontWeight:900}}>SIN NOTICIAS VERIFICADAS</AbsoluteFill>;
  }
  const imageAllowed = /^https:\/\//i.test(current.imageUrl || '');
  return (
    <AbsoluteFill style={{background:'#101827',color:'#fff',fontFamily:'Arial, Helvetica, sans-serif',overflow:'hidden'}}>
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 75% 25%,#1b4965 0%,#101827 58%,#080d16 100%)'}} />
      <div style={{position:'absolute',top:0,left:0,right:0,height:12,background:'#16a6b6'}} />
      <div style={{position:'absolute',top:42,left:48,right:48,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontSize:27,fontWeight:1000,letterSpacing:2}}>FC <span style={{color:'#42d5df'}}> / </span> {channelLabel}</div>
        <div style={{fontSize:17,fontWeight:900,letterSpacing:2,color:'#b8d7e8'}}>NOTICIAS RÁPIDAS</div>
      </div>
      <div style={{position:'absolute',top:145,left:48,right:48,bottom:130,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:21,fontWeight:900,color:'#42d5df',letterSpacing:3,marginBottom:18}}>NOTICIA {String(activeIndex + 1).padStart(2,'0')} / {String(safeItems.length).padStart(2,'0')}</div>
          <div style={{fontSize:58,lineHeight:1.04,fontWeight:1000,textShadow:'0 4px 12px #000'}}>{clamp(current.title,88)}</div>
        </div>
        <div style={{position:'relative',height:760,borderRadius:22,overflow:'hidden',background:'linear-gradient(145deg,#243d59,#0c1725)',border:'2px solid #3c627d'}}>
          {imageAllowed ? <Img src={current.imageUrl!} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top'}} /> : <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:72,fontWeight:1000,color:'#8fb5ce'}}>FÚTBOL</div>}
          <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,transparent 25%,rgba(3,9,17,.25) 48%,rgba(3,9,17,.96) 100%)'}} />
          <div style={{position:'absolute',left:28,right:28,bottom:34}}>
            {current.team ? <div style={{display:'inline-block',background:'#16a6b6',padding:'8px 14px',fontSize:20,fontWeight:900,marginBottom:16}}>{clamp(current.team,48)}</div> : null}
            <div style={{fontSize:42,lineHeight:1.13,fontWeight:1000,textShadow:'0 3px 9px #000'}}>{clamp(current.body,190)}</div>
            {current.score ? <div style={{marginTop:18,fontSize:42,fontWeight:1000,letterSpacing:3}}>{clamp(current.score,36)}</div> : null}
          </div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',gap:16,fontSize:17,color:'#c3d6e5'}}>
          <span>{clamp(current.source,55)} · {clamp(current.sourceDate,32)}</span>
          <span>{Math.max(0,Math.min(100,Math.round(((localFrame + 1) / current.frames) * 100)))}%</span>
        </div>
      </div>
      <div style={{position:'absolute',bottom:58,left:48,right:48,height:6,background:'#263c50',borderRadius:8,overflow:'hidden'}}>
        <div style={{height:'100%',width:progress+'%',background:'#42d5df'}} />
      </div>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:42,background:'#16a6b6',display:'flex',alignItems:'center',padding:'0 48px',fontSize:17,fontWeight:1000,letterSpacing:2}}>FÚTBOL CHILENO · LA ROJA · CHILENOS EN EL EXTERIOR · FÚTBOL MUNDIAL</div>
    </AbsoluteFill>
  );
};
