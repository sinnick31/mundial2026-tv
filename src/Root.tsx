import { Composition } from "remotion";
import { ResultadoShorts, defaultProps as defaultResultado } from "./ResultadoShorts";
import { PrediccionIA, defaultPrediccionProps } from "./PrediccionIA";
import { EstadisticaViral, defaultEstadisticaProps } from "./EstadisticaViral";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 1. Resultado Final — 10s */}
      <Composition
        id="ResultadoShorts"
        component={ResultadoShorts}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultResultado}
      />

      {/* 2. Predicción IA — 12s (más larga por el typewriter) */}
      <Composition
        id="PrediccionIA"
        component={PrediccionIA}
        durationInFrames={360}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultPrediccionProps}
      />

      {/* 3. Estadística Viral — 8s */}
      <Composition
        id="EstadisticaViral"
        component={EstadisticaViral}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultEstadisticaProps}
      />
    </>
  );
};
