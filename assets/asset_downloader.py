"""assets/asset_downloader.py — Descarga assets 100% libres de derechos para el noticiario.
- Clips de fútbol (Pexels Videos API, requiere PEXELS_API_KEY gratuita) → assets/clips/
- Fondos de estadios (Pexels Photos API) → assets/backgrounds/stadiums/
- Música épica/deportiva (ccMixter API, licencia CC BY; o MUSIC_URLS) → assets/music/
Si algo falla, registra el error y sigue; como último recurso genera una base musical sintética con ffmpeg.
Escribe assets/credits.json con autor, licencia y URL de cada recurso (para la descripción de YouTube)."""
import json, os, subprocess, sys, urllib.parse, urllib.request

KEY = os.environ.get("PEXELS_API_KEY", "")
BASE = os.path.dirname(os.path.abspath(__file__))
DIRS = {k: os.path.join(BASE, v) for k, v in {"clips": "clips", "bg": "backgrounds/stadiums", "music": "music"}.items()}
VIDEO_Q = ["soccer", "football stadium", "goal celebration", "football training"]
PHOTO_Q = ["football stadium", "soccer ball", "stadium crowd"]
MAX_CLIPS, MAX_FOTOS, MAX_MUSICA = int(os.environ.get("MAX_CLIPS", 8)), 6, 3
creditos = []

def log(m): print(f"[assets] {m}", flush=True)

def get_json(url, headers=None):
    req = urllib.request.Request(url, headers={"User-Agent": "mundial2026-tv-pipeline", **(headers or {})})
    with urllib.request.urlopen(req, timeout=30) as r: return json.load(r)

def bajar(url, dest):
    """Descarga a disco salvo que ya exista (idempotente, compatible con la caché de Actions)."""
    if os.path.exists(dest) and os.path.getsize(dest) > 10_000: return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "mundial2026-tv-pipeline"})
        with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f: f.write(r.read())
        return True
    except Exception as e: log(f"  fallo descargando {url[:80]}: {e}"); return False

def clips():
    if not KEY: log("AVISO: PEXELS_API_KEY no definida → se omiten clips (el video usará imágenes/colores)"); return
    n = len([f for f in os.listdir(DIRS["clips"]) if f.endswith(".mp4")])
    for q in VIDEO_Q:
        if n >= MAX_CLIPS: break
        try:
            data = get_json(f"https://api.pexels.com/videos/search?query={urllib.parse.quote(q)}&per_page=4&orientation=landscape&size=medium", {"Authorization": KEY})
        except Exception as e: log(f"error Pexels videos '{q}': {e}"); continue
        for v in data.get("videos", []):
            if n >= MAX_CLIPS: break
            # Archivo HD (≤1920 de ancho) para no inflar la caché
            fs = sorted([f for f in v.get("video_files", []) if f.get("file_type") == "video/mp4" and (f.get("width") or 0) <= 1920], key=lambda f: -(f.get("width") or 0))
            if not fs: continue
            dest = os.path.join(DIRS["clips"], f"pexels_{v['id']}.mp4")
            if bajar(fs[0]["link"], dest):
                n += 1; creditos.append({"tipo": "video", "autor": v.get("user", {}).get("name"), "fuente": "Pexels", "licencia": "Pexels License", "url": v.get("url")})
    log(f"clips disponibles: {n}")

def fotos():
    if not KEY: log("AVISO: sin PEXELS_API_KEY → se omiten fondos de estadio (se usará degradado)"); return
    n = 0
    for q in PHOTO_Q:
        try: data = get_json(f"https://api.pexels.com/v1/search?query={urllib.parse.quote(q)}&per_page={MAX_FOTOS // len(PHOTO_Q) + 1}&orientation=landscape", {"Authorization": KEY})
        except Exception as e: log(f"error Pexels fotos '{q}': {e}"); continue
        for p in data.get("photos", []):
            if bajar(p["src"]["large2x"], os.path.join(DIRS["bg"], f"pexels_{p['id']}.jpg")):
                n += 1; creditos.append({"tipo": "imagen", "autor": p.get("photographer"), "fuente": "Pexels", "licencia": "Pexels License", "url": p.get("url")})
    log(f"fondos descargados/verificados: {n}")

def musica():
    n = 0
    # 1) URLs directas definidas por el usuario (FMA, YouTube Audio Library exportada, etc.)
    for i, u in enumerate([u for u in os.environ.get("MUSIC_URLS", "").split(",") if u.strip()]):
        if bajar(u.strip(), os.path.join(DIRS["music"], f"custom_{i}.mp3")): n += 1; creditos.append({"tipo": "música", "fuente": "MUSIC_URLS", "url": u})
    # 2) ccMixter (solo licencia CC BY, uso comercial permitido con atribución)
    for tag in ["epic", "sport", "dramatic"]:
        if n >= MAX_MUSICA: break
        try: data = get_json(f"http://ccmixter.org/api/query?f=json&tags={tag},instrumental&lic=by&sort=rank&limit=3")
        except Exception as e: log(f"error ccMixter '{tag}': {e}"); continue
        for t in data:
            if n >= MAX_MUSICA: break
            mp3 = next((f.get("download_url") for f in t.get("files", []) if str(f.get("download_url", "")).endswith(".mp3")), None)
            if mp3 and bajar(mp3, os.path.join(DIRS["music"], f"ccmixter_{t.get('upload_id')}.mp3")):
                n += 1; creditos.append({"tipo": "música", "titulo": t.get("upload_name"), "autor": t.get("user_name"), "fuente": "ccMixter", "licencia": t.get("license_name", "CC BY"), "url": t.get("file_page_url")})
    # 3) Respaldo: base rítmica sintética generada localmente (sin derechos de terceros)
    if not [f for f in os.listdir(DIRS["music"]) if f.endswith(".mp3")]:
        log("sin música descargada → generando base sintética con ffmpeg")
        expr = "0.25*sin(2*PI*55*t)*exp(-8*mod(t,0.5))+0.08*sin(2*PI*220*t)*(0.5+0.5*sin(2*PI*0.25*t))+0.05*sin(2*PI*330*t)"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"aevalsrc='{expr}':s=44100:d=120", "-ac", "2", "-b:a", "128k",
                        os.path.join(DIRS["music"], "synthetic_epic.mp3")], check=False)
    log(f"música disponible: {len(os.listdir(DIRS['music']))} pistas")

def main():
    for d in DIRS.values(): os.makedirs(d, exist_ok=True)
    for paso in (clips, fotos, musica):
        try: paso()
        except Exception as e: log(f"ERROR en {paso.__name__}: {e} (se continúa)")
    cp = os.path.join(BASE, "credits.json"); prev = json.load(open(cp)) if os.path.exists(cp) else []
    urls = {c.get("url") for c in prev}; prev += [c for c in creditos if c.get("url") not in urls]
    json.dump(prev, open(cp, "w"), ensure_ascii=False, indent=2); log(f"créditos → {cp} ({len(prev)} recursos)")

if __name__ == "__main__":
    main()
