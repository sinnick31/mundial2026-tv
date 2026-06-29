/**
 * src/index.tsx
 * Registro de todas las composiciones de MUNDIAL 2026 TV
 * Agregar esta composición al index.tsx existente en el repo
 */

import { Composition } from 'remotion';
import { PrediccionShorts, PrediccionProps } from './PrediccionShorts';
// import { ResultadoShorts } from './ResultadoShorts'; // Ya existe en tu repo
// import { RankingShorts } from './RankingShorts';     // Opcional futuro
// import { NoticiaShorts } from './NoticiaShorts';     // Opcional futuro

// Props de ejemplo para preview en Remotion Studio
const PREVIEW_PREDICCION: PrediccionProps = {
  gancho: '¡ARGENTINA ELIMINADA!',
  subtitulo: 'La IA predice el mayor shock del Mundial 2026',
  descripcion: 'Argentina quedará fuera en octavos de final ante Francia en el que podría ser el último Mundial de Messi.',
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

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ─── Predicción viral (NUEVO) ──────────────────────────────────── */}
      <Composition
        id="PrediccionShorts"
        component={PrediccionShorts}
        durationInFrames={900}   // 30 segundos a 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={PREVIEW_PREDICCION}
      />

      {/* ─── Resultado de partido (ya existe) ─────────────────────────── */}
      {/* <Composition id="ResultadoShorts" component={ResultadoShorts} ... /> */}
    </>
  );
};
