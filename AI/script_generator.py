"""
AI/script_generator.py

Generador de guiones para Mundial2026-TV.

Construye el guion de un short vertical (Gancho -> Resultado -> Dato
curioso -> Clasificacion -> Proximo rival -> Llamado a comentar -> CTA)
a partir de los datos reales de un partido, usando el modelo Gemini de
Google Generative AI.

Uso:
    python AI/script_generator.py match_data.json > guion.json

    Requiere la variable de entorno GEMINI_API_KEY.
    """

import json
import os
import sys
from dataclasses import dataclass, asdict
from typing import Optional

try:
      import google.generativeai as genai
except ImportError:  # pragma: no cover
      genai = None

SECTIONS = [
      "gancho",
      "resultado",
      "dato_curioso",
      "clasificacion",
      "proximo_rival",
      "llamado_a_comentar",
      "cta",
]

SYSTEM_PROMPT = (
      "Eres el guionista de Mundial2026-TV, un canal de shorts verticales "
      "sobre el Mundial FIFA 2026. Los conductores son perros y un gato "
      "animados llamados Krono (conductor principal), Issy (analista "
      "energetica) y Kuky (experto tactico). El tono es entusiasta, claro "
      "y enfocado en resultados reales (nunca en predicciones).\n\n"
      "Genera el guion de un short de 30-45 segundos con estas 7 partes, "
      "cada una en una linea separada y prefijada exactamente con su "
      "nombre en mayusculas seguido de dos puntos:\n\n"
      "GANCHO: (maximo 3 segundos de lectura, debe enganchar de inmediato)\n"
      "RESULTADO: (marcador final y contexto breve)\n"
      "DATO_CURIOSO: (un dato verificable y llamativo del partido)\n"
      "CLASIFICACION: (como queda el grupo o la tabla tras este resultado)\n"
      "PROXIMO_RIVAL: (el siguiente partido de alguno de los equipos)\n"
      "LLAMADO_A_COMENTAR: (pregunta directa a la audiencia)\n"
      "CTA: (invitacion a suscribirse, breve)\n\n"
      "No inventes datos que no te den. Si falta un dato, escribe una "
      "frase generica pero honesta en su lugar."
)


@dataclass
class MatchData:
      home_team: str
      away_team: str
      home_score: int
      away_score: int
      competition: str = "Mundial FIFA 2026"
      matchday: Optional[str] = None
      curious_fact: Optional[str] = None
      standings_note: Optional[str] = None
      next_opponent: Optional[str] = None


def _build_user_prompt(match: MatchData) -> str:
      return (
                f"Partido: {match.home_team} {match.home_score}-{match.away_score} "
                f"{match.away_team}\n"
                f"Competicion: {match.competition}\n"
                f"Jornada: {match.matchday or 'sin especificar'}\n"
                f"Dato curioso disponible: {match.curious_fact or 'ninguno'}\n"
                f"Nota de clasificacion: {match.standings_note or 'ninguna'}\n"
                f"Proximo rival: {match.next_opponent or 'sin confirmar'}\n"
      )


def _parse_sections(raw_text: str) -> dict:
      result = {section: "" for section in SECTIONS}
      for line in raw_text.splitlines():
                line = line.strip()
                if not line or ":" not in line:
                              continue
                          key, _, value = line.partition(":")
                key = key.strip().lower()
                if key in result:
                              result[key] = value.strip()
                      return result


def generate_script(match: MatchData, model_name: str = "gemini-1.5-pro") -> dict:
      """Genera el guion estructurado para un partido usando Gemini.

          Si GEMINI_API_KEY no esta configurada o la libreria no esta
              instalada, devuelve una plantilla de respaldo para que el pipeline
                  no se detenga.
                      """
      api_key = os.environ.get("GEMINI_API_KEY")

    if genai is None or not api_key:
              return _fallback_script(match)

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name, system_instruction=SYSTEM_PROMPT)
    response = model.generate_content(_build_user_prompt(match))
    sections = _parse_sections(response.text or "")

    return {
              "match": asdict(match),
              "sections": sections,
              "full_text": response.text,
    }


def _fallback_script(match: MatchData) -> dict:
      """Plantilla simple sin IA, usada como respaldo si falta la API key."""
      sections = {
          "gancho": f"Que partidazo nos dejaron {match.home_team} y {match.away_team}!",
          "resultado": (
              f"Resultado final: {match.home_team} {match.home_score}-"
              f"{match.away_score} {match.away_team}."
          ),
          "dato_curioso": match.curious_fact or "Dato curioso pendiente de confirmar.",
          "clasificacion": match.standings_note or "Clasificacion pendiente de confirmar.",
          "proximo_rival": match.next_opponent or "Proximo rival por confirmar.",
          "llamado_a_comentar": "Que te parecio el partido? Cuentamelo en los comentarios.",
          "cta": "Suscribete para no perderte los resultados del Mundial FIFA 2026.",
      }
      return {"match": asdict(match), "sections": sections, "full_text": None}


def main():
      if len(sys.argv) < 2:
                print("Uso: python script_generator.py <match_data.json>", file=sys.stderr)
                sys.exit(1)

      with open(sys.argv[1], "r", encoding="utf-8") as fh:
                data = json.load(fh)

      match = MatchData(**data)
      result = generate_script(match)
      print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
      main()
  
