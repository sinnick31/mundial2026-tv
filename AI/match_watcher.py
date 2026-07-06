"""
AI/match_watcher.py

Orquestador principal de Mundial2026-TV.

Vigila los resultados de los partidos del Mundial FIFA 2026 y, en
cuanto detecta que uno termino, dispara automaticamente el resto del
pipeline (guion, narracion, prompt de video, miniatura y metadatos
SEO), dejando todo listo en videos/output/ sin intervencion manual.

Pensado para ejecutarse en un bucle continuo o programado (cron,
GitHub Actions, un scheduler local, etc.) cada pocos minutos durante
los dias de partidos.

Uso:
python AI/match_watcher.py            # corre en bucle continuo
python AI/match_watcher.py --once     # ejecuta un solo ciclo y termina

Requiere la variable de entorno FOOTBALL_API_KEY para consultar
resultados reales. Sin ella, el modulo se mantiene inactivo y avisa
por consola, sin detener el resto del pipeline.
"""

import json
import os
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:  # pragma: no cover
    requests = None

from script_generator import MatchData, generate_script
from narration import build_narration
from prompt_generator import build_video_prompt
from thumbnail_generator import build_thumbnail_prompt
from seo_generator import generate_metadata

FOOTBALL_API_KEY = os.environ.get("FOOTBALL_API_KEY", "")
FOOTBALL_API_URL = os.environ.get(
    "FOOTBALL_API_URL",
    "https://api.football-data.org/v4/competitions/WC/matches",
)

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_PATH = BASE_DIR / "config" / "processed_matches.json"
OUTPUT_DIR = BASE_DIR / "videos" / "output"

DEFAULT_INTERVAL_SECONDS = 300


def load_processed_ids():
    if PROCESSED_PATH.exists():
        with open(PROCESSED_PATH, "r", encoding="utf-8") as fh:
            return set(json.load(fh))
    return set()


def save_processed_ids(processed_ids):
    PROCESSED_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(PROCESSED_PATH, "w", encoding="utf-8") as fh:
        json.dump(sorted(processed_ids), fh, ensure_ascii=False, indent=2)


def fetch_finished_matches():
    """Consulta la API de resultados y devuelve solo partidos finalizados.

    Si no hay API key configurada o falta la libreria 'requests', no
    detiene el pipeline: simplemente devuelve una lista vacia y avisa
    por consola.
    """
    if not FOOTBALL_API_KEY or requests is None:
        print(
            "match_watcher: FOOTBALL_API_KEY no configurada (o falta "
            "'requests'). No se pueden consultar resultados reales todavia."
        )
        return []

    headers = {"X-Auth-Token": FOOTBALL_API_KEY}
    try:
        response = requests.get(FOOTBALL_API_URL, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()
    except Exception as error:  # pragma: no cover
        print(f"match_watcher: error consultando la API de resultados: {error}")
        return []

    return [m for m in data.get("matches", []) if m.get("status") == "FINISHED"]


def _match_to_match_data(raw_match):
    home = raw_match.get("homeTeam", {}).get("name", "Equipo local")
    away = raw_match.get("awayTeam", {}).get("name", "Equipo visitante")
    full_time = raw_match.get("score", {}).get("fullTime", {})

    return MatchData(
        home_team=home,
        away_team=away,
        home_score=full_time.get("home", 0) or 0,
        away_score=full_time.get("away", 0) or 0,
        matchday=str(raw_match.get("matchday", "")) or None,
    )


def process_match(raw_match):
    """Ejecuta el pipeline completo para un partido finalizado y guarda
    los archivos generados en una carpeta propia dentro de videos/output/.
    """
    match_data = _match_to_match_data(raw_match)
    print(
        f"match_watcher: procesando {match_data.home_team} "
        f"{match_data.home_score}-{match_data.away_score} "
        f"{match_data.away_team}"
    )

    script = generate_script(match_data)
    narration = build_narration(script)
    video_prompt = build_video_prompt(script)
    thumbnail_prompt = build_thumbnail_prompt(script)
    metadata = generate_metadata(script)

    folder_name = f"{match_data.home_team}_vs_{match_data.away_team}".replace(" ", "_")
    match_dir = OUTPUT_DIR / folder_name
    match_dir.mkdir(parents=True, exist_ok=True)

    with open(match_dir / "guion.json", "w", encoding="utf-8") as fh:
        json.dump(script, fh, ensure_ascii=False, indent=2)
    with open(match_dir / "narracion.json", "w", encoding="utf-8") as fh:
        json.dump(narration, fh, ensure_ascii=False, indent=2)
    with open(match_dir / "video_prompt.txt", "w", encoding="utf-8") as fh:
        fh.write(video_prompt)
    with open(match_dir / "thumbnail_prompt.txt", "w", encoding="utf-8") as fh:
        fh.write(thumbnail_prompt)
    with open(match_dir / "metadata.json", "w", encoding="utf-8") as fh:
        json.dump(metadata, fh, ensure_ascii=False, indent=2)

    print(f"match_watcher: listo -> {match_dir}")
    return match_dir


def run_cycle():
    """Ejecuta un ciclo: revisa resultados, procesa los partidos nuevos
    y actualiza el registro de procesados. Devuelve cuantos partidos
    nuevos se procesaron.
    """
    processed_ids = load_processed_ids()
    finished_matches = fetch_finished_matches()
    new_matches = [
        m for m in finished_matches if str(m.get("id")) not in processed_ids
    ]

    if not new_matches:
        print("match_watcher: no hay partidos nuevos por procesar.")
        return 0

    for raw_match in new_matches:
        try:
            process_match(raw_match)
            processed_ids.add(str(raw_match.get("id")))
        except Exception as error:  # pragma: no cover
            print(
                f"match_watcher: error procesando partido "
                f"{raw_match.get('id')}: {error}"
            )

    save_processed_ids(processed_ids)
    return len(new_matches)


def main():
    run_once = "--once" in sys.argv

    if run_once:
        run_cycle()
        return

    print("match_watcher: iniciando vigilancia continua del Mundial FIFA 2026...")
    while True:
        run_cycle()
        time.sleep(DEFAULT_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()

