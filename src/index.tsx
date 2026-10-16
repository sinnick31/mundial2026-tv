import { Composition, registerRoot } from 'remotion';
import { PrediccionShorts, PrediccionProps } from './PrediccionShorts';
import { JugadaAnimada, defaultJugadaProps } from './JugadaAnimada';
import { ChileLongform, ChileLongformProps } from './ChileLongform';
import { ResultsThumbnail } from './ResultsThumbnail';

const PREVIEW_PROPS: PrediccionProps = {
  gancho: 'DATOS DEL FÚTBOL CHILENO',
  subtitulo: 'Noticias reales, contexto y fuentes',
  descripcion: 'Resumen editorial basado en fuentes deportivas verificables.',
  equipo1: 'Chile',
  equipo2: undefined,
  probabilidad: 0,
  puntos: [
    'Colo-Colo como prioridad editorial',
    'Competencias chilenas',
    'Futbolistas chilenos en el exterior',
  ],
  emoji: '🇨🇱',
  tipo: 'noticia',
};

const LONGFORM_PROPS: ChileLongformProps = {
  title: 'Resumen del fútbol chileno',
  intro: 'Noticias reales, contexto y fuentes originales.',
  sections: [
    { orden: 1, titulo: 'Colo-Colo', cuerpo: 'Sección de prueba.', fuente: 'Fuentes del día', url: '' },
    { orden: 2, titulo: 'Fútbol chileno', cuerpo: 'Sección de prueba.', fuente: 'Fuentes del día', url: '' },
    { orden: 3, titulo: 'Chilenos en el exterior', cuerpo: 'Sección de prueba.', fuente: 'Fuentes del día', url: '' },
  ],
};

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PrediccionShorts"
        component={PrediccionShorts}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={PREVIEW_PROPS}
      />
      <Composition
        id="JugadaAnimada"
        component={JugadaAnimada}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultJugadaProps}
      />
      <Composition
        id="ResultsThumbnail"
        component={ResultsThumbnail}
        durationInFrames={1}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{ date: '2026-10-16', count: 12 }}
      />
      <Composition
        id="ChileLongform"
        component={ChileLongform}
        durationInFrames={3600}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={LONGFORM_PROPS}
      />
    </>
  );
};

registerRoot(RemotionRoot);
