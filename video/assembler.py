"""video/assembler.py — Ensambla el noticiario con estructura de canal grande (GOAL / ESPN / TNT Sports).
Estructura: INTRO (10s) → TITULARES (5 x 3s, cuenta regresiva) → DESARROLLO (clip + título + TTS) → OUTRO (10s).
Usa ffmpeg (drawtext + fade) y continúa con fondos de color si faltan clips/música (nunca se cae por un asset)."""
import glob, json, os, random, subprocess, sys, textwrap

W, H, FPS = 1280, 720, 25
FONT = next((f for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                         "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"] if os.path.exists(f)), None)
WORK = "videos/output/tmp"
CANAL = os.environ.get("CHANNEL_NAME", "MUNDIAL 2026 TV")

def log(m): print(f"[video] {m}", flush=True)

def ffmpeg(args):
    """Ejecuta ffmpeg y muestra el final del error si falla."""
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error"] + args, capture_output=True, text=True)
    if r.returncode: raise RuntimeError(r.stderr[-800:])

def duracion(path):
    try: return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).strip())
    except Exception: return 0.0

def txtfile(texto, nombre):
    """drawtext lee el texto desde archivo para evitar problemas de escape con tildes, comillas y dos puntos."""
    p = os.path.abspath(os.path.join(WORK, nombre)); open(p, "w", encoding="utf-8").write(texto); return p

def dt(texto, nombre, size, y, color="white", box=None, x="(w-text_w)/2", enable=None):
    f = f"drawtext=fontfile={FONT}:textfile={txtfile(texto, nombre)}:fontsize={size}:fontcolor={color}:x={x}:y={y}:borderw=3:bordercolor=black"
    if box: f += f":box=1:boxcolor={box}:boxborderw=18"
    if enable: f += f":enable='{enable}'"
    return f

def fondo_input(clip, img, dur):
    """Entrada de video: clip en bucle > imagen fija > color azul Chile."""
    if clip: return ["-stream_loop", "-1", "-t", f"{dur}", "-i", clip]
    if img: return ["-loop", "1", "-t", f"{dur}", "-i", img]
    return ["-f", "lavfi", "-t", f"{dur}", "-i", f"color=c=0x0039A6:s={W}x{H}:r={FPS}"]

def audio_input(src, dur, ss=0.0):
    if src: return ["-ss", f"{ss}", "-t", f"{dur}", "-i", src]
    return ["-f", "lavfi", "-t", f"{dur}", "-i", "anullsrc=r=44100:cl=stereo"]

def segmento(out, dur, clip, img, textos, voz=None, voz_ss=0.0, musica=None, vol_musica=0.6):
    """Renderiza un segmento homogéneo (1280x720, 25fps, AAC estéreo) para poder concatenar sin cortes."""
    args = fondo_input(clip, img, dur) + audio_input(voz, dur, voz_ss) + audio_input(musica, dur, random.uniform(0, 20) if musica else 0)
    base = f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={FPS},eq=brightness=-0.12:saturation=1.2"
    vf = ",".join([base] + textos + [f"fade=t=in:st=0:d=0.5,fade=t=out:st={max(dur-0.5,0)}:d=0.5,format=yuv420p[v]"])
    vm = 0.12 if voz else vol_musica  # música baja bajo la narración (ducking simple)
    af = (f"[1:a]aformat=channel_layouts=stereo,aresample=44100,volume=1.6[a1];"
          f"[2:a]aformat=channel_layouts=stereo,aresample=44100,volume={vm}[a2];"
          f"[a1][a2]amix=inputs=2:duration=first:normalize=0,afade=t=in:d=0.4,afade=t=out:st={max(dur-0.6,0)}:d=0.6[a]")
    ffmpeg(args + ["-filter_complex", f"{vf};{af}", "-map", "[v]", "-map", "[a]", "-t", f"{dur}",
                   "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac", "-ar", "44100", "-ac", "2", out])

def corto(t, n=60):
    t = t.rsplit(" - ", 1)[0]  # quita " - Fuente"
    return t if len(t) <= n else t[:n-1].rsplit(" ", 1)[0] + "…"

def srt_t(s): return f"{int(s//3600):02}:{int(s%3600//60):02}:{int(s%60):02},{int(s%1*1000):03}"

def main():
    st = json.load(open("pipeline_state.json"))
    if not st.get("hay_contenido"): log("sin contenido, nada que ensamblar"); return
    os.makedirs(WORK, exist_ok=True)
    clips = sorted(glob.glob("assets/clips/*.mp4")); imgs = sorted(glob.glob("assets/backgrounds/**/*.[jp][pn]g", recursive=True))
    musica = sorted(glob.glob("assets/music/*.mp3")); mus = musica[0] if musica else None
    log(f"assets: {len(clips)} clips, {len(imgs)} imágenes, {len(musica)} pistas de música")
    pick = lambda i: (clips[i % len(clips)] if clips else None, imgs[i % len(imgs)] if imgs and not clips else None)
    audio = f"audio/output/{st['date']}.mp3"
    voz = audio if os.path.exists(audio) else None
    if not voz: log("AVISO: sin narración TTS, el desarrollo irá solo con música")
    noticias = st.get("noticias", [])[:8] or [{"title": st.get("headline", "Noticias del día")}]
    segs, i = [], 0
    def nuevo(): nonlocal i; i += 1; return os.path.abspath(os.path.join(WORK, f"seg{i:02}.mp4"))

    # INTRO 0-10s: nombre del canal animado (aparece con fade) + rótulo
    p = nuevo(); c, im = pick(0)
    segmento(p, 10, c, im, [f"drawbox=y=ih*0.36:w=iw:h=ih*0.30:color=0xD52B1E@0.85:t=fill:enable='gte(t,1)'",
             dt(CANAL, "i1.txt", 84, "h*0.39", enable="gte(t,1)"),
             dt("NOTICIAS FÚTBOL CHILE", "i2.txt", 46, "h*0.54", "0xFFD700", enable="gte(t,2.5)"),
             dt(st["date"], "i3.txt", 32, "h*0.85", enable="gte(t,4)")], musica=mus, vol_musica=0.9); segs.append(p)

    # TITULARES 10-25s: cuenta regresiva 5→1, 3 s por titular
    top = noticias[:5]
    for k, n in enumerate(reversed(top)):
        p = nuevo(); c, im = pick(k + 1); num = len(top) - k
        lineas = textwrap.wrap(corto(n["title"], 90).upper(), 34)[:2]
        tx = [f"drawbox=x=0:y=ih*0.62:w=iw:h=ih*0.30:color=black@0.7:t=fill",
              dt(str(num), f"n{k}.txt", 220, "h*0.12", "0xFFD700", x="60"),
              dt("TITULARES DEL DÍA", f"h{k}.txt", 40, "50", box="0xD52B1E@0.9", x="w-text_w-50")]
        tx += [dt(l, f"t{k}{j}.txt", 48, f"h*0.65+{j*62}") for j, l in enumerate(lineas)]
        segmento(p, 3, c, im, tx, musica=mus, vol_musica=0.8); segs.append(p)

    # DESARROLLO: narración repartida entre noticias, clip distinto por noticia + lower third
    total = duracion(voz) if voz else 20.0 * len(noticias)
    per = max(total / len(noticias), 4.0); srt = []
    for k, n in enumerate(noticias):
        p = nuevo(); c, im = pick(k + 6)
        lineas = textwrap.wrap(corto(n["title"], 100), 46)[:2]
        fuente = n.get("fuente_original") or n.get("feed") or ""
        tx = [f"drawbox=x=0:y=ih-200:w=iw:h=200:color=0x0039A6@0.88:t=fill", f"drawbox=x=0:y=ih-200:w=iw:h=8:color=0xD52B1E:t=fill",
              dt(f"NOTICIA {k+1}/{len(noticias)}", f"d{k}.txt", 30, "40", box="0xD52B1E@0.95", x="40")]
        tx += [dt(l, f"dl{k}{j}.txt", 42, f"h-180+{j*54}", x="40") for j, l in enumerate(lineas)]
        if fuente: tx.append(dt(f"Fuente: {fuente}", f"df{k}.txt", 24, "h-50", "0xFFD700", x="40"))
        segmento(p, per, c, im, tx, voz=voz, voz_ss=k * per, musica=mus); segs.append(p)
        srt.append((25 + 10 * 0 + k * per, corto(n["title"], 100)))

    # OUTRO: Suscríbete con botón pulsante simple
    p = nuevo(); c, im = pick(len(noticias) + 6)
    segmento(p, 10, c, im, ["drawbox=x=(iw-520)/2:y=ih*0.42:w=520:h=110:color=0xFF0000@0.95:t=fill:enable='lt(mod(t,1),0.7)'",
             dt("¡SUSCRÍBETE!", "o1.txt", 70, "h*0.44"), dt("Activa la campanita 🔔 y comenta tu opinión", "o2.txt", 34, "h*0.66", "0xFFD700"),
             dt("Noticias del fútbol chileno y femenino cada día", "o3.txt", 28, "h*0.78")], musica=mus, vol_musica=0.9); segs.append(p)

    # Concatenación final (los segmentos ya tienen el mismo códec y fades propios)
    lst = os.path.join(WORK, "list.txt"); open(lst, "w").write("".join(f"file '{s}'\n" for s in segs))
    out = f"videos/output/{st['date']}.mp4"; tmp = out + ".tmp.mp4"
    ffmpeg(["-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", tmp])

    # Subtítulos opcionales quemados (BURN_SUBS=true): un rótulo por noticia durante el desarrollo
    if os.environ.get("BURN_SUBS", "false").lower() == "true":
        sp = os.path.abspath(os.path.join(WORK, "subs.srt"))
        with open(sp, "w", encoding="utf-8") as f:
            for j, (t0, t) in enumerate(srt): f.write(f"{j+1}\n{srt_t(t0)} --> {srt_t(t0+per)}\n{t}\n\n")
        try:
            ffmpeg(["-i", tmp, "-vf", f"subtitles={sp}:force_style='FontSize=20,Alignment=8'", "-c:a", "copy", out]); os.remove(tmp)
        except Exception as e: log(f"AVISO: no se pudieron quemar subtítulos ({e}); se publica sin ellos"); os.replace(tmp, out)
    else: os.replace(tmp, out)
    st["video"] = out; json.dump(st, open("pipeline_state.json", "w"), ensure_ascii=False, indent=2)
    log(f"→ {out} ({duracion(out):.1f}s, {len(segs)} segmentos)")

if __name__ == "__main__":
    try: main()
    except Exception as e: log(f"ERROR {e}"); sys.exit(1)
