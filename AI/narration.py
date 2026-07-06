"""
AI/narration.py

Convierte el guion estructurado en un guion de narracion con tiempos
estimados por seccion, listo para pasarse a un motor de texto a voz
(TTS).

Este modulo NO sintetiza audio: prepara el texto y los tiempos. La
sintesis de voz depende del proveedor que configures (Google TTS,
ElevenLabs, etc.) y de tu propia API key.

Uso:
    python AI/narration.py guion.json > narracion.json
    """

import json
import sys

# Duracion objetivo aproximada por seccion, en segundos.
SECTION_DURATIONS = {
      "gancho": 3,
      "resultado": 6,
      "dato_curioso": 6,
      "clasificacion": 6,
      "proximo_rival": 5,
      "llamado_a_comentar": 4,
      "cta": 4,
}


def build_narration(script: dict) -> dict:
      sections = script.get("sections", {})
      timeline = []
      cursor = 0.0

    for key, duration in SECTION_DURATIONS.items():
              text = sections.get(key, "").strip()
              if not text:
                            continue
                        timeline.append(
                                      {
                                                        "section": key,
                                                        "text": text,
                                                        "start": round(cursor, 1),
                                                        "duration": duration,
                                      }
                        )
        cursor += duration

    return {"timeline": timeline, "total_duration": round(cursor, 1)}


def main():
      if len(sys.argv) < 2:
                print("Uso: python narration.py <guion.json>", file=sys.stderr)
                sys.exit(1)

    with open(sys.argv[1], "r", encoding="utf-8") as fh:
              script = json.load(fh)

    narration = build_narration(script)
    print(json.dumps(narration, ensure_ascii=False, indent=2))


if __name__ == "__main__":
      main()
