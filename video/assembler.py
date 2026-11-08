"""video/assembler.py — Audio + diapositivas (fondo + titulares superpuestos) → MP4 1280x720 con ffmpeg.
Fondos: imágenes en assets/backgrounds/stadiums/*.jpg|png (licencia libre) o fondo generado con colores de Chile."""
import glob, json, os, subprocess, sys, textwrap
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "thumbnails"))
from thumbnail_generator import font

def duration(path):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).strip())

def slide(bg, title, sub, out):
    img = Image.open(bg).convert("RGB").resize((1280, 720)).filter(ImageFilter.GaussianBlur(3)) if bg else Image.new("RGB", (1280, 720), "#0039A6")
    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle([0, 470, 1280, 720], fill=(213, 43, 30, 225)); d.rectangle([0, 0, 1280, 70], fill=(0, 57, 166, 230))
    d.text((30, 12), "🇨🇱 NOTICIAS FÚTBOL CHILE", font=font(40), fill="white")
    y = 490
    for line in textwrap.wrap(title, 42)[:3]:
        d.text((30, y), line, font=font(50), fill="white", stroke_width=2, stroke_fill="black"); y += 62
    d.text((30, 680), sub[:90], font=font(26), fill="#FFD700")
    img.save(out)

def main():
    st = json.load(open("pipeline_state.json"))
    if not st.get("hay_contenido"):
        print("[video] sin contenido"); return
    audio = f"audio/output/{st['date']}.mp3"
    total = duration(audio)
    bgs = sorted(glob.glob("assets/backgrounds/stadiums/*.[jp][pn]g"))
    work = "videos/output/tmp"; os.makedirs(work, exist_ok=True)
    slides = [(st["headline"], "Titular principal")]
    slides += [(n["title"], f"Fuente: {n.get('fuente_original') or n.get('feed')}") for n in st["noticias"]]
    slides.append(("¡Suscríbete y activa la campanita!", "Noticias del fútbol chileno cada día"))
    per = total / len(slides)
    lst = os.path.join(work, "list.txt")
    with open(lst, "w") as f:
        for i, (t, s) in enumerate(slides):
            p = os.path.abspath(os.path.join(work, f"s{i}.png")); slide(bgs[i % len(bgs)] if bgs else None, t, s, p)
            f.write(f"file '{p}'\nduration {per:.2f}\n")
        f.write(f"file '{p}'\n")
    out = f"videos/output/{st['date']}.mp4"
    cmd = ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-i", audio, "-vf", "fps=25,format=yuv420p",
           "-c:v", "libx264", "-preset", "veryfast", "-c:a", "aac", "-b:a", "160k", "-shortest", out]
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"[video] → {out} ({total:.1f}s, {len(slides)} escenas)")

if __name__ == "__main__":
    try: main()
    except subprocess.CalledProcessError as e: print("[video] ERROR ffmpeg", e.stderr.decode()[-800:]); sys.exit(1)
    except Exception as e: print("[video] ERROR", e); sys.exit(1)
