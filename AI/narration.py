"""
AI/narration.py

Convierte el guion estructurado en un guion de narracion con tiempos
estimados por seccion, y opcionalmente sintetiza el audio final usando
un proveedor de texto a voz (TTS).

Uso:
python AI/narration.py guion.json > narracion.json
python AI/narration.py guion.json --audio narracion.mp3

Proveedor de TTS: ElevenLabs (por defecto). Requiere las variables de
entorno ELEVENLABS_API_KEY y, opcionalmente, ELEVENLABS_VOICE_ID y
ELEVENLABS_MODEL_ID. Si no estan configuradas, este modulo sigue
funcionando con normalidad: simplemente no genera el archivo de audio,
sin detener el resto del pipeline.
"""

import json
import os
import sys
from pathlib import Path
from typing import Optional

try:
    import requests
except ImportError:  # pragma: no cover
    requests = None

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

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")
ELEVENLABS_MODEL_ID = os.environ.get("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")
ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"


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


def _full_narration_text(narration: dict) -> str:
    """Une el texto de todas las secciones en un solo guion de narracion,
    en el orden en que se deben leer."""
    return " ".join(item["text"] for item in narration.get("timeline", []))


def synthesize_audio(
    narration: dict,
    output_path: Path,
    voice_id: Optional[str] = None,
) -> Optional[Path]:
    """Sintetiza el audio de la narracion completa usando ElevenLabs.

    Devuelve la ruta del archivo generado, o None si no hay API key
    configurada, falta la libreria 'requests', o la sintesis falla. En
    ningun caso detiene el resto del pipeline: la falta de audio no es
    un error fatal, solo una funcionalidad opcional pendiente de
    configurar.
    """
    if not ELEVENLABS_API_KEY or requests is None:
        print(
            "narration: ELEVENLABS_API_KEY no configurada (o falta "
            "'requests'). Se omite la sintesis de audio por ahora."
        )
        return None

    text = _full_narration_text(narration)
    if not text:
        print("narration: no hay texto disponible para sintetizar.")
        return None

    url = ELEVENLABS_URL.format(voice_id=voice_id or ELEVENLABS_VOICE_ID)
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": ELEVENLABS_MODEL_ID,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
    except Exception as error:  # pragma: no cover
        print(f"narration: error sintetizando audio con ElevenLabs: {error}")
        return None

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as fh:
        fh.write(response.content)

    print(f"narration: audio generado en {output_path}")
    return output_path


def main():
    if len(sys.argv) < 2:
        print(
            "Uso: python narration.py <guion.json> [--audio salida.mp3]",
            file=sys.stderr,
        )
        sys.exit(1)

    with open(sys.argv[1], "r", encoding="utf-8") as fh:
        script = json.load(fh)

    narration = build_narration(script)
    print(json.dumps(narration, ensure_ascii=False, indent=2))

    if "--audio" in sys.argv:
        idx = sys.argv.index("--audio")
        if idx + 1 < len(sys.argv):
            audio_path = Path(sys.argv[idx + 1])
        else:
            audio_path = Path("narracion.mp3")
        synthesize_audio(narration, audio_path)


if __name__ == "__main__":
    main()
