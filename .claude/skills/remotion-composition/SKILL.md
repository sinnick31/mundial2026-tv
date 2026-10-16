---
name: remotion-composition
description: Crea o modifica composiciones de Remotion en src/ (Shorts 9:16, largo 16:9, miniaturas) y las valida con tsc, eslint y un render de prueba.
---

# Composiciones de Remotion

Código en `src/`. Composiciones registradas en `src/Root.tsx` (`ResultadoShorts`, `PrediccionIA`, `EstadisticaViral`, `PrediccionShorts`, `JugadaAnimada`) y en `src/index.tsx` (`ChileLongform`, `ResultsThumbnail`).

## Pasos para una composición nueva

1. Crear `src/NombreComposicion.tsx` con props tipadas y exportar los tipos.
2. Registrar un `<Composition>` (o `<Still>` para miniaturas) con `id`, `width`, `height`, `fps`, `durationInFrames` y `defaultProps` realistas, copiando el patrón del archivo de registro más cercano.
   - Shorts: 1080x1920. Largos: 1920x1080.
3. Usar las fuentes de `@remotion/google-fonts` y estilos con Tailwind v4 como el resto de `src/`.
4. Validar: `npm run lint`.
5. Probar un frame sin renderizar el video completo:
   ```bash
   npx remotion still src/index.tsx NombreComposicion /tmp/prueba.png --frame=0
   ```
6. Si la composición se publica, añadir su archivo a los `paths` de `ci.yml` y a los workflows que la usan.

## Reglas

- Mantener la identidad visual de `assets/visual-identity/`.
- No incluir logos, escudos, clips ni música sin derechos comprobados (ver `docs/IMAGENES_EQUIPOS.md`).
- No cambiar versiones de `remotion` y `@remotion/*` por separado: deben coincidir (hoy 4.0.483).
