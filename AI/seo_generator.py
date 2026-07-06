"""
AI/seo_generator.py

Genera metadata SEO (titulo, descripcion, hashtags) para un short de
Mundial2026-TV a partir del guion generado por script_generator.py.

Uso:
    python AI/seo_generator.py guion.json > metadata.json
    """

import json
import os
import sys

try:
      import google.generativeai as genai
except ImportError:  # pragma: no cover
      genai = None

BASE_HASHTAGS = [
      "#Mundial2026", "#FIFAWorldCup", "#Resultados", "#Futbol",
      "#Football", "#Shorts", "#Resumen", "#Goles", "#FIFA", "#WorldCup2026",
]

SYSTEM_PROMPT = (
      "Eres el especialista en SEO de Mundial2026-TV. A partir de un guion "
      "de resultado final, generas: 1) Un titulo de video corto (menos de "
      "90 caracteres) con el marcador y los equipos, sin clickbait "
      "generico. 2) Una descripcion corta (3-4 lineas) en el mismo tono "
      "que el guion. 3) Una lista de 5 hashtags adicionales relevantes al "
      "partido (equipos, fase del torneo, jugadores), sin repetir los "
      "hashtags base del canal. Responde en JSON con las claves: title, "
      "description, extra_hashtags (lista)."
)


def _extract_match_line(script: dict) -> str:
      match = script.get("match", {})
      home = match.get("home_team", "Equipo local")
      away = match.get("away_team", "Equipo visitante")
      home_score = match.get("home_score", "?")
      away_score = match.get("away_score", "?")
      return f"{home} {home_score}-{away_score} {away}"


def generate_metadata(script: dict, model_name: str = "gemini-1.5-pro") -> dict:
      api_key = os.environ.get("GEMINI_API_KEY")
      match_line = _extract_match_line(script)
      sections = script.get("sections", {})

    if genai is None or not api_key:
              return _fallback_metadata(match_line, sections)

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name, system_instruction=SYSTEM_PROMPT)
    prompt = (
              f"Resultado: {match_line}\n"
              f"Gancho: {sections.get('gancho', '')}\n"
              f"Dato curioso: {sections.get('dato_curioso', '')}\n"
              f"Clasificacion: {sections.get('clasificacion', '')}\n"
              f"Proximo rival: {sections.get('proximo_rival', '')}\n"
    )
    response = model.generate_content(prompt)

    try:
              parsed = json.loads(response.text)
except (ValueError, TypeError):
          return _fallback_metadata(match_line, sections)

    parsed.setdefault("extra_hashtags", [])
    parsed["hashtags"] = BASE_HASHTAGS + parsed["extra_hashtags"]
    return parsed


def _fallback_metadata(match_line: str, sections: dict) -> dict:
      title = f"{match_line}: resultado final con analisis 3D"
      description = (
          "RESULTADO FINAL\n\n"
          "Revive el marcador definitivo, las claves del partido y los "
          "momentos mas importantes en este resumen con animacion 3D "
          "cinematografica.\n\n"
          f"{sections.get('llamado_a_comentar', '')}\n\n"
          f"{sections.get('cta', '')}"
      )
      return {
          "title": title,
          "description": description,
          "extra_hashtags": [],
          "hashtags": BASE_HASHTAGS,
      }


def main():
      if len(sys.argv) < 2:
                print("Uso: python seo_generator.py <guion.json>", file=sys.stderr)
                sys.exit(1)

      with open(sys.argv[1], "r", encoding="utf-8") as fh:
                script = json.load(fh)

      metadata = generate_metadata(script)
      print(json.dumps(metadata, ensure_ascii=False, indent=2))


if __name__ == "__main__":
      main()
  
