import { Composition } from "remotion";
import { ResultadoShorts, defaultProps as defaultResultado } from "./ResultadoShorts";
import { PrediccionIA, defaultPrediccionProps } from "./PrediccionIA";
import { EstadisticaViral, defaultEstadisticaProps } from "./EstadisticaViral";
import { PrediccionShorts } from "./PrediccionShorts";
import { JugadaAnimada, defaultJugadaProps } from "./JugadaAnimada";

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

      {/* 4. Predicción Shorts (producción real, con broll + narración opcional) — 30s por defecto */}
      <Composition
        id="PrediccionShorts"
        component={PrediccionShorts}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          gancho: "¡ARGENTINA ELIMINADA!",
          subtitulo: "La IA predice el mayor shock del Mundial 2026",
          descripcion: "Argentina quedará fuera en octavos de final ante Francia.",
          equipo1: "Argentina",
          equipo2: "Francia",
          probabilidad: 67,
          puntos: [
            "Francia llega en su mejor momento con Mbappé imparable",
            "Argentina con lesiones en defensa y mediocampo",
            "El factor Francia como favorita histórica del torneo",
          ],
          emoji: "⚽",
          tipo: "eliminacion",
        }}
      />

      {/* 5. Jugada Animada — recreación 2D del gol, sin footage con copyright — 12s por defecto */}
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
