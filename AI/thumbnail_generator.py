"""
AI/thumbnail_generator.py

Genera el prompt/concepto de miniatura (thumbnail) para un short de
Mundial2026-TV: marcador grande, banderas de los equipos y una emocion
clara, tal como recomienda la estrategia de crecimiento del canal.

Este modulo NO genera la imagen final: produce el "brief" creativo que
luego se pasa a la herramienta de generacion de imagenes que configures.

Uso:
    python AI/thumbnail_generator.py guion.json > thumbnail_prompt.txt
    """

import json
import sys

THUMBNAIL_TEMPLATE = (
      "Miniatura para YouTube Shorts / TikTok / Reels.\n\n"
      "Composicion:\n"
      "- Marcador final en numeros grandes y contrastantes: {score_display}\n"
      "- Banderas de {home_team} y {away_team} a cada lado del marcador.\n"
      "- Expresion facial de {reaction_character} mostrando {emotion} en "
      "primer plano.\n"
      "- Fondo: estudio deportivo animado con pantallas LED y luces de "
      "transmision.\n"
      "- Texto de apoyo (opcional, corto): \"{support_text}\"\n"
      "- Formato vertical 9:16, alto contraste, legible en tamano pequeno.\n"
)


def _infer_emotion(home_score: int, away_score: int) -> str:
      if home_score == away_score:
                return "sorpresa"
            diff = abs(home_score - away_score)
    if diff >= 3:
              return "asombro / shock"
          return "euforia"


def build_thumbnail_prompt(script: dict) -> str:
      match = script.get("match", {})
    home = match.get("home_team", "Equipo local")
            away = match.get("away_team", "Equipo visitante")
    home_score = int(match.get("home_score", 0) or 0)
    away_score = int(match.get("away_score", 0) or 0)

    score_display = f"{home_score}-{away_score}"
    emotion = _infer_emotion(home_score, away_score)
    sections = script.get("sections", {})
    support_text = sections.get("gancho", "").strip() or f"{home} {score_display} {away}"

    return THUMBNAIL_TEMPLATE.format(
              score_display=score_display,
              home_team=home,
              away_team=away,
              reaction_character="Krono",
              emotion=emotion,
              support_text=support_text[:40],
    )


def main():
      if len(sys.argv) < 2:
                print("Uso: python thumbnail_generator.py <guion.json>", file=sys.stderr)
                sys.exit(1)

    with open(sys.argv[1], "r", encoding="utf-8") as fh:
              script = json.load(fh)

    print(build_thumbnail_prompt(script))


if __name__ == "__main__":
      main()
