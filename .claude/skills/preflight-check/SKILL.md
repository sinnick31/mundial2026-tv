---
name: preflight-check
description: Ejecuta las mismas validaciones que el CI y el pipeline (sintaxis de scripts, tests de política de publicación, eslint y tsc) antes de abrir un PR o hacer push a main.
---

# Preflight antes de PR o push

Úsala siempre que se modifiquen `scripts/`, `src/`, `tests/`, `package.json` o `.github/workflows/`.

## Pasos

1. Instalar dependencias si faltan: `npm ci`.
2. Validar sintaxis de los scripts que el CI revisa:
   ```bash
   for f in publication-policy render-and-upload fetch-matches generate-results-longform generate-narration preflight-youtube-auth fetch-real-news generate-real-content viral-score; do node --check scripts/$f.js || exit 1; done
   ```
3. Validar que `tsconfig.json` es JSON válido (el pipeline falla si tiene `\n` literales):
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('tsconfig.json','utf8'))"
   ```
4. Ejecutar los tests: `npm run test:publication-policy`.
5. Ejecutar `npm run lint` (eslint en `src` + `tsc`).
6. Si se tocó un workflow, revisar que los `paths` de `ci.yml` incluyen los archivos nuevos que deben validarse.

## Reglas

- Si un paso falla, corregir la causa; no desactivar el chequeo ni usar `--no-verify`.
- No cambiar el valor por defecto de visibilidad (`unlisted`) ni el bloqueo de publicación pública programada en `scripts/publication-policy.js` sin que el usuario lo pida de forma explícita.
- Informar al final qué pasos corrieron y cuáles no pudieron correr (por ejemplo, sin red para `npm ci`).
