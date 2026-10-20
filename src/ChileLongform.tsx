import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, interpolate } from 'remotion';

export interface ChileLongformSection { orden: number; titulo: string; cuerpo: string; fuente: string; url: string; }
export interface ChileLongformProps { title: string; intro: string; sections: ChileLongformSection[]; audioSrc?: string; fuente?: string; sectionDurationInFrames?: number; }
const clamp = (s: string, n: number) => (s || '').length > n ? `${s.slice(0, n - 1)}…` : s;
export const ChileLongform: React.FC<ChileLongformProps> = ({ title, intro, sections, audioSrc, fuente, sectionDurationInFrames = 450 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp' });
  const safeSections = sections?.length ? sections : [];
  const slot = Math.max(1, sectionDurationInFrames);
  const active = Math.min(safeSections.length - 1, Math.max(0, Math.floor(frame / slot)));
  const current = safeSections[active] || { orden: 1, titulo: 'Resumen', cuerpo: intro, fuente: fuente || 'Fuentes del día', url: '' };
  const teams = current.titulo.match(/^(.*?)\s+(\d+)\s*[-–]\s*(\d+)\s+(.*)$/);
  const isChile = /chile|colo colo|copa chile|liga de ascenso/i.test(current.titulo + ' ' + current.cuerpo);
  const progress = safeSections.length ? Math.min(100, ((active + 1) / safeSections.length) * 100) : 100;
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg,#101827 0%,#172438 55%,#101827 100%)', color: '#fff', fontFamily: 'Arial, Helvetica, sans-serif', opacity }}>
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}
      <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 80% 15%,rgba(26,120,190,.23),transparent 42%)'}} />
      <div style={{position:'absolute',left:0,right:0,top:0,height:12,background:'#E63946'}}/>
      <div style={{position:'absolute',left:64,right:64,top:44,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:18}}>
          <div style={{background:'#E63946',padding:'12px 18px',fontSize:21,fontWeight:900,letterSpacing:2}}>CF</div>
          <div style={{fontSize:24,fontWeight:900,letterSpacing:3}}>CHILENSIS FÚTBOL</div>
        </div>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:2,color:'#f3f6fa'}}>EDICIÓN DIARIA · {isChile ? 'FÚTBOL CHILENO' : 'FÚTBOL INTERNACIONAL'}</div>
      </div>
      <div style={{position:'absolute',left:64,right:64,top:126,bottom:88,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:18,color:'#7fc7ff',fontWeight:800,letterSpacing:4,marginBottom:14}}>LOS MARCADORES QUE DEBES CONOCER</div>
          <div style={{fontSize:48,lineHeight:1.08,fontWeight:900,maxWidth:1650}}>{clamp(title,105)}</div>
          <div style={{fontSize:23,lineHeight:1.4,color:'#c4d1df',marginTop:15,maxWidth:1500}}>{clamp(intro,250)}</div>
        </div>
        <div style={{display:'flex',alignItems:'stretch',gap:28,minHeight:270}}>
          <div style={{width:105,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#E63946',borderRadius:8,flexShrink:0}}>
            <div style={{fontSize:15,fontWeight:900,letterSpacing:2}}>PARTIDO</div><div style={{fontSize:48,fontWeight:900}}>{String(current.orden).padStart(2,'0')}</div>
          </div>
          <div style={{flex:1,background:'linear-gradient(115deg,rgba(20,42,67,.98),rgba(12,26,43,.98))',border:'1px solid #294661',borderRadius:12,padding:'28px 34px',display:'flex',flexDirection:'column',justifyContent:'center',boxShadow:'0 18px 60px rgba(0,0,0,.22)'}}>
            {teams ? <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:24,marginBottom:22}}>
              <div style={{flex:1,fontSize:35,fontWeight:900,lineHeight:1.1}}>{clamp(teams[1].trim(),35)}</div>
              <div style={{display:'flex',alignItems:'center',gap:18,background:'#101827',border:'1px solid #35536e',borderRadius:10,padding:'14px 24px',fontSize:48,fontWeight:900,fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap'}}><span>{teams[2]}</span><span style={{color:'#E63946'}}>:</span><span>{teams[3]}</span></div>
              <div style={{flex:1,textAlign:'right',fontSize:35,fontWeight:900,lineHeight:1.1}}>{clamp(teams[4].trim(),35)}</div>
            </div> : <div style={{fontSize:36,fontWeight:900,marginBottom:20}}>{clamp(current.titulo,100)}</div>}
            <div style={{fontSize:23,lineHeight:1.42,color:'#e3ebf3'}}>{clamp(current.cuerpo,350)}</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:22,paddingTop:14,borderTop:'1px solid #294661',fontSize:16,color:'#a7bdd1'}}>
              <span>FUENTE: {clamp(current.fuente,65)}</span><span>{active+1} / {Math.max(1,safeSections.length)}</span>
            </div>
          </div>
        </div>
        <div>
          <div style={{height:5,background:'#20374d',borderRadius:4,overflow:'hidden',marginBottom:14}}><div style={{height:'100%',width:`${progress}%`,background:'#E63946'}}/></div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:16,color:'#a7bdd1'}}>
            <span>COLO-COLO · FÚTBOL CHILENO · CHILENOS EN EL EXTERIOR · EL MUNDO</span><span>FUENTES ENLAZADAS EN LA DESCRIPCIÓN</span>
          </div>
        </div>
      </div>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:58,background:'#E63946',display:'flex',alignItems:'center',padding:'0 64px',fontSize:18,fontWeight:900,letterSpacing:2}}>RESULTADOS VERIFICADOS · RESUMEN DIARIO · CHILENSIS FÚTBOL</div>
    </AbsoluteFill>
  );
};
