import { Composition, registerRoot } from 'remotion';
import { PrediccionShorts, PrediccionProps } from './PrediccionShorts';

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
    </>
  );
};

registerRoot(RemotionRoot);
