"""tts/narrator.py — Guion → MP3 voz masculina español.
El SDK de Abacus.AI no expone TTS, por eso se usa edge-tts (gratuito, voz chilena es-CL-LorenzoNeural)
con respaldo gTTS."""
import asyncio, json, os, sys

async def edge(text, out):
    import edge_tts
    await edge_tts.Communicate(text, os.getenv("TTS_VOICE", "es-CL-LorenzoNeural"), rate="+8%").save(out)

def main():
    st = json.load(open("pipeline_state.json"))
    if not st.get("hay_contenido"):
        print("[tts] sin contenido"); return
    text = open(st["script"], encoding="utf-8").read()
    os.makedirs("audio/output", exist_ok=True)
    out = f"audio/output/{st['date']}.mp3"
    try:
        asyncio.run(edge(text, out))
    except Exception as e:
        print("[tts] WARN edge-tts falló, uso gTTS:", e)
        from gtts import gTTS
        gTTS(text, lang="es", tld="cl").save(out)
    print("[tts] →", out)

if __name__ == "__main__":
    try: main()
    except Exception as e: print("[tts] ERROR", e); sys.exit(1)
