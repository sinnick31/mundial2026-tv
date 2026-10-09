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
          gancho: "ÚLTIMA HORA DEL FÚTBOL",
          subtitulo: "Noticias de fútbol chileno y mundial",
          descripcion: "Resumen editorial con fuente, fecha y contexto verificados antes de publicar.",
          equipo1: "Fútbol chileno",
          equipo2: "Fútbol mundial",
          probabilidad: 0,
          puntos: [
            "Hechos confirmados desde una fuente identificable",
            "Fecha de publicación separada de la fecha del partido",
            "Análisis editorial propio, separado de los hechos",
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
