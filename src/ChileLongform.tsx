import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useCurrentFrame, interpolate } from 'remotion';

export interface ChileLongformSection {
  orden: number;
  tipo?: 'resultado' | 'proximo';
  titulo: string;
  cuerpo: string;
  fuente: string;
  url: string;
  escudoLocal?: string;
  escudoVisita?: string;
  estadio?: string;
  fechaTexto?: string;
}
export interface ChileLongformProps {
  title: string;
  intro: string;
  sections: ChileLongformSection[];
  audioSrc?: string;
  fuente?: string;
  sectionFrames?: number[];
  introFrames?: number;
  sectionDurationInFrames?: number;
}
const clamp = (s: string, n: number) => (s || '').length > n ? `${s.slice(0, n - 1)}…` : s;
const initials = (s: string) => (s || '?').split(/\\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const colors = ['#E63946','#22A6B3','#F4A261','#7C5CFC'];
const TeamBadge: React.FC<{name:string; src?:string; align?:'left'|'right'}> = ({name,src,align='left'}) => (
  <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',alignItems:align==='right'?'flex-end':'flex-start',gap:12}}>
    {src && /^https:\\/\\//i.test(src) ? <Img src={src} style={{width:100,height:100,objectFit:'contain',background:'rgba(255,255,255,.96)',borderRadius:18,padding:8}} /> :
      <div style={{width:100,height:100,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(145deg,#f7fafc,#cbd5e1)',color:'#172438',borderRadius:18,fontSize:30,fontWeight:1000,border:'3px solid rgba(255,255,255,.25)'}}>{initials(name)}</div>}
    <div style={{fontSize:29,fontWeight:900,lineHeight:1.12,textAlign:align==='right'?'right':'left'}}>{clamp(name,34)}</div>
  </div>
);
export const ChileLongform: React.FC<ChileLongformProps> = ({ title, intro, sections, audioSrc, fuente, sectionFrames, introFrames = 0, sectionDurationInFrames = 450 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp' });
  const safeSections = sections?.length ? sections : [];
  const sceneFrame = Math.max(0, frame - introFrames);
  const isIntro = frame < introFrames;
  let active = 0;
  let elapsed = 0;
  for (let i=0;i<safeSections.length;i++) {
    const length = Math.max(1, sectionFrames?.[i] || sectionDurationInFrames);
    if (sceneFrame < elapsed + length) { active = i; break; }
    elapsed += length;
    active = Math.min(i + 1, safeSections.length - 1);
  }
  const current: ChileLongformSection = isIntro ? { orden: 0, tipo: 'resultado', titulo: 'LA EDICIÓN DE HOY', cuerpo: intro, fuente: fuente || 'Fuentes consultadas', url: '' } : safeSections[active] || { orden: 1, titulo: 'Resumen', cuerpo: intro, fuente: fuente || 'Fuentes consultadas', url: '' };
  const score = current.tipo === 'resultado' ? current.titulo.match(/^(.*?)\\s+(\\d+)\\s*[-–]\\s*(\\d+)\\s+(.*)$/) : null;
  const isUpcoming = current.tipo === 'proximo' || current.titulo.startsWith('PRÓXIMO:');
  const isChile = /chile|colo colo|copa chile|liga de ascenso/i.test(current.titulo + ' ' + current.cuerpo);
  const progress = isIntro ? 0 : safeSections.length ? Math.min(100, ((active + 1) / safeSections.length) * 100) : 100;
  const accent = colors[active % colors.length];
  const template = active % 3;
  return (
    <AbsoluteFill style={{background: template===1 ? 'linear-gradient(130deg,#101827,#25344b 50%,#101827)' : template===2 ? 'linear-gradient(135deg,#102d2a,#173d48 55%,#101827)' : 'linear-gradient(135deg,#101827 0%,#172438 55%,#101827 100%)',color:'#fff',fontFamily:'Arial, Helvetica, sans-serif',opacity,overflow:'hidden'}}>
      {audioSrc ? <Audio src={staticFile(audioSrc)} /> : null}
      <div style={{position:'absolute',inset:0,background:template===1?'radial-gradient(ellipse at 50% 40%,rgba(124,92,252,.25),transparent 58%)':'radial-gradient(ellipse at 80% 15%,rgba(26,120,190,.23),transparent 42%)'}} />
      <div style={{position:'absolute',right:-120,top:170,width:560,height:560,borderRadius:280,border:`35px solid ${accent}22`}}/>
      <div style={{position:'absolute',left:0,right:0,top:0,height:12,background:accent}}/>
      <div style={{position:'absolute',left:64,right:64,top:38,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:18}}>
          <div style={{background:accent,padding:'12px 18px',fontSize:21,fontWeight:900,letterSpacing:2}}>CF</div>
          <div style={{fontSize:24,fontWeight:900,letterSpacing:3}}>CHILENSIS FÚTBOL</div>
        </div>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:2,color:'#f3f6fa'}}>EDICIÓN DIARIA · {isUpcoming?'PRÓXIMOS PARTIDOS':isChile?'FÚTBOL CHILENO':'FÚTBOL INTERNACIONAL'}</div>
      </div>
      <div style={{position:'absolute',left:64,right:64,top:118,bottom:88,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:18,color:accent,fontWeight:800,letterSpacing:4,marginBottom:12}}>{isIntro?'APERTURA · CHILE Y EL MUNDO':isUpcoming?'AGENDA · FECHAS PROGRAMADAS':template===0?'EL MARCADOR Y SUS DATOS':template===1?'LA FICHA DEL ENCUENTRO':'RESULTADOS · CHILE Y EL MUNDO'}</div>
          <div style={{fontSize:46,lineHeight:1.08,fontWeight:900,maxWidth:1650}}>{clamp(title,105)}</div>
          <div style={{fontSize:21,lineHeight:1.35,color:'#c4d1df',marginTop:12,maxWidth:1500}}>{clamp(intro,220)}</div>
        </div>
        <div style={{display:'flex',alignItems:'stretch',gap:24,minHeight:300}}>
          <div style={{width:100,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:accent,borderRadius:8,flexShrink:0}}>
            <div style={{fontSize:13,fontWeight:900,letterSpacing:2}}>{isUpcoming?'FECHA':'FICHA'}</div><div style={{fontSize:44,fontWeight:900}}>{String(current.orden).padStart(2,'0')}</div>
          </div>
          <div style={{flex:1,background:template===2?'linear-gradient(115deg,rgba(11,48,47,.97),rgba(12,26,43,.98))':'linear-gradient(115deg,rgba(20,42,67,.98),rgba(12,26,43,.98))',border:`1px solid ${accent}66`,borderRadius:14,padding:'24px 30px',display:'flex',flexDirection:'column',justifyContent:'center',boxShadow:'0 18px 60px rgba(0,0,0,.22)'}}>
            {score ? <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:26,marginBottom:20}}>
              <TeamBadge name={score[1].trim()} src={current.escudoLocal} />
              <div style={{display:'flex',alignItems:'center',gap:18,background:'#101827',border:`1px solid ${accent}`,borderRadius:10,padding:'16px 25px',fontSize:54,fontWeight:1000,fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap'}}><span>{score[2]}</span><span style={{color:accent}}>:</span><span>{score[3]}</span></div>
              <TeamBadge name={score[4].trim()} src={current.escudoVisita} align="right" />
            </div> : <div style={{fontSize:35,fontWeight:900,marginBottom:18}}>{clamp(current.titulo,105)}</div>}
            <div style={{fontSize:22,lineHeight:1.38,color:'#e3ebf3'}}>{clamp(current.cuerpo,360)}</div>
            {current.estadio ? <div style={{marginTop:16,display:'inline-flex',alignSelf:'flex-start',gap:10,alignItems:'center',background:'#0b1726',padding:'10px 14px',borderRadius:8,fontSize:18,color:'#d8e9f7'}}>🏟️ {clamp(current.estadio,100)}</div> : null}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:18,paddingTop:12,borderTop:'1px solid #294661',fontSize:15,color:'#a7bdd1'}}>
              <span>FUENTE: {clamp(current.fuente,55)}</span><span>{active+1} / {Math.max(1,safeSections.length)}</span>
            </div>
          </div>
        </div>
        <div>
          <div style={{height:5,background:'#20374d',borderRadius:4,overflow:'hidden',marginBottom:12}}><div style={{height:'100%',width:`${progress}%`,background:accent}}/></div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:15,color:'#a7bdd1'}}>
            <span>COLO-COLO · FÚTBOL CHILENO · CHILENOS EN EL EXTERIOR · EL MUNDO</span><span>FUENTES ENLAZADAS EN LA DESCRIPCIÓN</span>
          </div>
        </div>
      </div>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:58,background:accent,display:'flex',alignItems:'center',padding:'0 64px',fontSize:18,fontWeight:900,letterSpacing:2}}>{isIntro?'NOTICIAS Y FÚTBOL · CHILENSIS FÚTBOL':isUpcoming?'AGENDA DE ENCUENTROS · HORARIOS SUJETOS A CAMBIOS':'RESULTADOS Y DATOS DISPONIBLES · CHILENSIS FÚTBOL'}</div>
    </AbsoluteFill>
  );
};
