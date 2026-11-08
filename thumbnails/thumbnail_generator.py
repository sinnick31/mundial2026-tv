"""thumbnails/thumbnail_generator.py — Miniatura 1280x720 rojo/azul/blanco con titular y fecha."""
import json, os, sys, textwrap
from PIL import Image, ImageDraw, ImageFont

def font(size):
    for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]:
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()

def draw_ball(d, cx, cy, r):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill="white", outline="black", width=6)
    pts = [(cx, cy - r * .45), (cx + r * .43, cy - r * .14), (cx + r * .27, cy + r * .37), (cx - r * .27, cy + r * .37), (cx - r * .43, cy - r * .14)]
    d.polygon(pts, fill="black")

def main():
    st = json.load(open("pipeline_state.json"))
    if not st.get("hay_contenido"):
        print("[thumb] sin contenido"); return
    img = Image.new("RGB", (1280, 720), "white")
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 1280, 360], fill="#0039A6"); d.rectangle([0, 360, 1280, 720], fill="#D52B1E")
    d.rectangle([0, 0, 360, 360], fill="#0039A6")
    star = [(180, 90), (205, 160), (280, 160), (220, 205), (243, 275), (180, 232), (117, 275), (140, 205), (80, 160), (155, 160)]
    d.polygon(star, fill="white")
    draw_ball(d, 1130, 150, 100)
    d.text((400, 40), "NOTICIAS FÚTBOL CHILE", font=font(64), fill="white", stroke_width=3, stroke_fill="black")
    d.text((400, 120), st["date"] + (" · NOCHE" if st.get("edition") == "noche" else ""), font=font(48), fill="#FFD700", stroke_width=2, stroke_fill="black")
    y = 380
    for line in textwrap.wrap(st["headline"].upper(), 30)[:4]:
        d.text((40, y), line, font=font(68), fill="white", stroke_width=4, stroke_fill="black"); y += 82
    os.makedirs("thumbnails/output", exist_ok=True)
    out = f"thumbnails/output/{st['date']}.png"; img.save(out); print("[thumb] →", out)

if __name__ == "__main__":
    try: main()
    except Exception as e: print("[thumb] ERROR", e); sys.exit(1)
