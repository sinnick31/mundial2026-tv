import { Composition, registerRoot } from 'remotion';
import { PrediccionShorts, PrediccionProps } from './PrediccionShorts';
import { JugadaAnimada, JugadaAnimadaProps, defaultJugadaProps } from './JugadaAnimada';

const PREVIEW_PROPS: PrediccionProps = {
  gancho: '¡ARGENTINA ELIMINADA!',
  subtitulo: 'La IA predice el mayor shock del Mundial 2026',
  descripcion: 'Argentina quedará fuera en octavos de final ante Francia.',
  equipo1: 'Argentina',
  equipo2: 'Francia',
  probabilidad: 67,
  puntos: [
    'Francia llega en su mejor momento con Mbappé imparable',
    'Argentina con lesiones en defensa y mediocampo',
    'El factor Francia como favorita histórica del torneo',
  ],
  emoji: '⚽',
  tipo: 'eliminacion',
};

// Esta es la raíz que usa el pipeline real (render-and-upload.js apunta a
// src/index.tsx explícitamente). Por eso AMBAS composiciones que se usan
// en producción (PrediccionShorts y JugadaAnimada) deben estar registradas
// acá, no solo en Root.tsx (que es para `remotion studio`).
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
    </>
  );
};

registerRoot(RemotionRoot);
