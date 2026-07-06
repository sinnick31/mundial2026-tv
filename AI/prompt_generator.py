"""
AI/prompt_generator.py

Genera el prompt de video cinematografico (estilo Pixar) para el
estudio deportivo animado de Mundial2026-TV, listo para usarse en una
herramienta de generacion de video por IA.

Uso:
    python AI/prompt_generator.py guion.json > video_prompt.txt
    """

import json
import sys

CHARACTERS = {
      "krono": "perro animado, conductor principal, energico y carismatico",
      "issy": "perra animada, analista energetica, expresiva",
      "kuky": "perro animado, experto tactico, sereno y preciso",
      "pepa": "gata animada, coprotagonista",
      "zeus": "perro animado, personaje de refuerzo del estudio",
}

PROMPT_TEMPLATE = (
      "Create a Pixar-quality cinematic football TV studio.\n"
      "Two animated dogs ({presenter_a} and {presenter_b}) and one cat "
      "({presenter_c}) discuss the final result of today's FIFA World Cup "
      "match: {match_line}.\n"
      "LED screens in the background display the final score "
      "({score_display}).\n"
      "Dynamic camera movement, ultra realistic lighting and textures.\n"
      "Vertical format 9:16, 4K, 60fps.\n"
)


def _pick_presenters():
      return "Krono", "Kuky", "Issy"


def build_video_prompt(script: dict) -> str:
      match = script.get("match", {})
      home = match.get("home_team", "Equipo local")
      away = match.get("away_team", "Equipo visitante")
      home_score = match.get("home_score", "?")
      away_score = match.get("away_score", "?")

    match_line = f"{home} {home_score}-{away_score} {away}"
    score_display = f"{home} {home_score} - {away_score} {away}"
    presenter_a, presenter_b, presenter_c = _pick_presenters()

    return PROMPT_TEMPLATE.format(
              presenter_a=presenter_a,
              presenter_b=presenter_b,
              presenter_c=presenter_c,
              match_line=match_line,
              score_display=score_display,
    )


def main():
      if len(sys.argv) < 2:
                print("Uso: python prompt_generator.py <guion.json>", file=sys.stderr)
                sys.exit(1)

      with open(sys.argv[1], "r", encoding="utf-8") as fh:
                script = json.load(fh)

      print(build_video_prompt(script))


if __name__ == "__main__":
      main()
  
