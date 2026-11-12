"""thumbnails/thumbnail_generator.py — Miniaturas 1280x720 estilo canales top (fondo de acción, 2-3 palabras gigantes,
gradiente oscuro inferior, bandera de Chile en esquina). Genera variantes A/B/C para pruebas A/B en YouTube Studio."""
import glob, json, os, random, re, sys
from PIL import Image, ImageDraw, ImageEnhance, ImageFont

W, H = 1280, 720
GANCHOS = ["OFICIAL", "BOMBA", "ÚLTIMA HORA", "EXCLUSIVO", "CONFIRMADO", "ATENCIÓN"]
VACIAS = {"de", "la", "el", "los", "las", "y", "en", "a", "con", "para", "por", "del", "su", "sus", "que", "un", "una", "vs", "al", "se", "fue", "lo",
          "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic", "estadísticas", "equipo"}

def font(size):
    """Fuente bold del sistema (DejaVu/Liberation); cae a la por defecto si no existe."""
    for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]:
        if os.path.exists(f): return ImageFont.truetype(f, size)
    return ImageFont.load_default()

def fondo(seed):
    """Imagen de estadio/acción desde assets; si no hay, degradado azul-rojo."""
    imgs = sorted(glob.glob("assets/backgrounds/**/*.[jp][pn]g", recursive=True))
    if imgs:
        im = Image.open(imgs[seed % len(imgs)]).convert("RGB")
        r = max(W / im.width, H / im.height); im = im.resize((int(im.width * r) + 1, int(im.height * r) + 1))
        im = im.crop(((im.width - W) // 2, (im.height - H) // 2, (im.width - W) // 2 + W, (im.height - H) // 2 + H))
        return ImageEnhance.Contrast(ImageEnhance.Color(im).enhance(1.4)).enhance(1.15)
    im = Image.new("RGB", (W, H)); d = ImageDraw.Draw(im)
    for y in range(H): d.line([(0, y), (W, y)], fill=(int(213 * y / H), 57 - int(30 * y / H), int(166 * (1 - y / H))))
    return im

def gradiente(im):
    """Gradiente negro en la mitad inferior para que el texto resalte."""
    g = Image.new("L", (1, H)); [g.putpixel((0, y), int(235 * max(0, (y - H * .35) / (H * .65)) ** 1.2)) for y in range(H)]
    im.paste(Image.new("RGB", (W, H), "black"), (0, 0), g.resize((W, H))); return im

def bandera(d, x, y, w=150):
    h = w * 2 // 3
    d.rectangle([x, y, x + w, y + h], fill="#D52B1E"); d.rectangle([x, y, x + w, y + h // 2], fill="white")
    d.rectangle([x, y, x + h // 2, y + h // 2], fill="#0039A6")
    cx, cy, r = x + h // 4, y + h // 4, h // 7
    import math
    pts = [(cx + (r if k % 2 == 0 else r * .4) * math.sin(k * math.pi / 5), cy - (r if k % 2 == 0 else r * .4) * math.cos(k * math.pi / 5)) for k in range(10)]
    d.polygon(pts, fill="white"); d.rectangle([x, y, x + w, y + h], outline="white", width=4)

def palabras_clave(titulo, n=3):
    """Extrae 2-3 palabras potentes (nombres propios primero) del titular."""
    t = titulo.rsplit(" - ", 1)[0]
    ws = [w for w in re.findall(r"[\wÁÉÍÓÚÑáéíóúñ]+", t) if w.lower() not in VACIAS and len(w) > 2]
    propios = [w for w in ws if w[0].isupper()]
    sel = (propios + [w for w in ws if w not in propios])[:n]
    return " ".join(sel).upper() or "FÚTBOL CHILENO"

def texto_ajustado(d, txt, max_w, size):
    while size > 40 and d.textlength(txt, font=font(size)) > max_w: size -= 4
    return font(size)

def variante(st, tipo, out):
    random.seed(tipo); im = gradiente(fondo(ord(tipo))); d = ImageDraw.Draw(im)
    principal = palabras_clave(st["headline"], 3 if tipo != "B" else 2)
    gancho = {"A": "ÚLTIMA HORA", "B": random.choice(GANCHOS), "C": "OFICIAL"}[tipo]
    color = {"A": "#FFD700", "B": "white", "C": "#FFD700"}[tipo]
    # Etiqueta gancho (caja roja tipo "breaking news")
    f = font(52); tw = d.textlength(gancho, font=f)
    d.rectangle([40, 40, 80 + tw, 120], fill="#E10600"); d.text((60, 50), gancho, font=f, fill="white")
    bandera(d, W - 200, 40)
    # Texto principal: 2-3 palabras, máximo 2 líneas, sombra negra gruesa
    ws = principal.split(); lineas = [" ".join(ws[:2]), " ".join(ws[2:])] if len(ws) > 2 else [principal]
    y = H - 60 - 150 * len([l for l in lineas if l])
    for l in [l for l in lineas if l]:
        fl = texto_ajustado(d, l, W - 80, 150)
        d.text((46, y + 8), l, font=fl, fill="black")  # sombra desplazada
        d.text((40, y), l, font=fl, fill=color, stroke_width=8, stroke_fill="black"); y += 150
    if tipo == "C":  # variante C: borde amarillo llamativo
        d.rectangle([0, 0, W - 1, H - 1], outline="#FFD700", width=14)
    im.save(out, quality=95)

def main():
    st = json.load(open("pipeline_state.json"))
    if not st.get("hay_contenido"): print("[thumb] sin contenido"); return
    os.makedirs("thumbnails/output", exist_ok=True); outs = []
    for t in "ABC":
        try:
            p = f"thumbnails/output/{st['date']}_{t}.png"; variante(st, t, p); outs.append(p); print("[thumb] →", p)
        except Exception as e: print(f"[thumb] ERROR variante {t}: {e}")
    if not outs: sys.exit(1)
    # La variante A se copia como miniatura principal (nombre que usa el uploader)
    principal = f"thumbnails/output/{st['date']}.png"; Image.open(outs[0]).save(principal)
    st["thumbnail"], st["thumbnails_ab"] = principal, outs
    json.dump(st, open("pipeline_state.json", "w"), ensure_ascii=False, indent=2)

if __name__ == "__main__":
    try: main()
    except Exception as e: print("[thumb] ERROR", e); sys.exit(1)
