import { Composition } from "remotion";
import { ResultadoShorts, defaultProps } from "./ResultadoShorts";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/**
       * ResultadoShorts
       * ─────────────────────────────────────────────────────────────────
       * Formato : 1080 × 1920 (YouTube Shorts / TikTok / Instagram Reels)
       * Duración: 10 segundos @ 30fps = 300 frames
       * Props   : Enviados via Make.com webhook para automatización
       */}
      <Composition
        id="ResultadoShorts"
        component={ResultadoShorts}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
      />
    </>
  );
};
