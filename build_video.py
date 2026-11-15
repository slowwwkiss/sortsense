#!/usr/bin/env python3
"""Build the SortSense demo video (2-3 min) for Arbiter Hacks V1.
Screen recordings (Playwright) + PIL title/outro slides + gTTS narration.
Assembled with ffmpeg. All narration is plain natural English.
"""
import os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

WDIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(WDIR)
VENV = os.path.join(WDIR, "tools", "venv", "bin", "python")

W, H = 1280, 720
BG = (20, 83, 45)       # deep green
BG2 = (21, 128, 61)     # green
WHITE = (255, 255, 255)
MINT = (187, 247, 208)
GRAY = (220, 230, 225)
F_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
F_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def font(p, s):
    return ImageFont.truetype(p, s)

def center_text(d, y, text, f, fill):
    w = d.textlength(text, font=f)
    d.text(((W - w) / 2, y), text, font=f, fill=fill)
    return y + int(f.size * 1.4)

def slide_title():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 8], fill=MINT)
    center_text(d, 190, "SortSense", font(F_BOLD, 120), WHITE)
    center_text(d, 340, "point, scan, sort right", font(F_REG, 44), MINT)
    center_text(d, 470, "About a quarter of recycling is contaminated.", font(F_REG, 30), GRAY)
    center_text(d, 512, "SortSense answers in seconds, while you hold the item.", font(F_REG, 30), GRAY)
    center_text(d, 620, "Arbiter Hacks V1  ·  Theme: Rethinking Waste", font(F_BOLD, 24), MINT)
    img.save("video/slide-title.png")

def slide_outro():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 8], fill=MINT)
    center_text(d, 180, "No account. No tracking.", font(F_BOLD, 64), WHITE)
    center_text(d, 270, "No server to pay for.", font(F_BOLD, 64), WHITE)
    center_text(d, 400, "A static site that runs anywhere, even offline.", font(F_REG, 32), MINT)
    center_text(d, 500, "github.com/slowwwkiss/sortsense", font(F_BOLD, 34), WHITE)
    center_text(d, 590, "Built for Arbiter Hacks V1", font(F_REG, 26), GRAY)
    img.save("video/slide-outro.png")

SEGMENTS = [
    ("video/slide-title.png", "slide", "skip",
     "About a quarter of everything people put in recycling bins does not belong there. "
     "One wrong item can send a whole truckload to landfill. "
     "The rules are confusing, and they change from city to city. "
     "Most people want to recycle right, they just do not know how. "
     "SortSense answers the question in seconds, right when you are holding the item."),
    ("video/raw/seg-nutella.webm", "clip", "result",
     "Take a jar of Nutella. Scan the barcode, and SortSense breaks down every part of the packaging. "
     "The glass jar goes in the glass bin. The plastic lid can be recycled too. "
     "The foil seal goes with aluminium. Three parts, three answers, no guessing."),
    ("video/raw/seg-pringles.webm", "clip", "result",
     "Some packs are trickier. A Pringles tube is cardboard, foil, and plastic stuck together, "
     "so most of it goes in the trash. SortSense tells you that straight, "
     "and shows you the one part you can still save."),
    ("video/raw/seg-photo.webm", "clip", "pred",
     "No barcode? Take a photo. The model runs right on your device, and nothing is uploaded. "
     "It sees a water bottle, made of PET plastic, and tells you to recycle it. "
     "It is a best guess, so the guide is always one tap away."),
    ("video/raw/seg-guide.webm", "clip", "search",
     "There is also a guide for everyday items, and a log that tracks your impact. "
     "Batteries, for example, never go in any bin. They cause fires in trucks and sorting plants, "
     "so SortSense sends you to a drop off point instead. Scan a can, log it, "
     "and you can already see the carbon you kept out of the air."),
    ("video/slide-outro.png", "slide", "skip",
     "SortSense is a static site. No account, no tracking, no server to pay for. "
     "It runs anywhere, even offline. Built for Arbiter Hacks, theme track: rethinking waste."),
]

def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        print("FAILED:", " ".join(cmd), "\n", r.stdout, r.stderr)
        sys.exit(1)
    return r

def ffprobe_dur(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", path], capture_output=True, text=True)
    return float(r.stdout.strip())

def main():
    slide_title()
    slide_outro()
    print("slides done")
    # narration per segment (gTTS, proven working in this VM)
    durs = []
    for i, (_, _, _, text) in enumerate(SEGMENTS, 1):
        mp3 = f"video/seg{i}.mp3"
        run([VENV, "-c",
             "import sys; from gtts import gTTS; "
             f"gTTS(text={text!r}, lang='en', slow=False).save({mp3!r})"])
        d = ffprobe_dur(mp3)
        durs.append(d)
        print(f"seg{i}: {d:.2f}s ({len(text.split())} words)")
    total = sum(durs)
    print(f"narration total: {total:.2f}s")
    gaps = [1.0] * (len(SEGMENTS) - 1) + [6.0]
    vdurs = [d + g for d, g in zip(durs, gaps)]
    print("clip targets:", [f"{v:.2f}" for v in vdurs], "total:", f"{sum(vdurs):.2f}s")
    # padded audio
    aud = []
    for i, (d, g) in enumerate(zip(durs, gaps), 1):
        run(["ffmpeg", "-y", "-v", "error", "-i", f"video/seg{i}.mp3", "-f", "lavfi",
             "-i", "anullsrc=r=24000:cl=stereo", "-filter_complex",
             "[0:a][1:a]concat=n=2:v=0:a=1", "-t", f"{d + g:.3f}", f"video/seg{i}p.mp3"])
        aud.append(f"file 'seg{i}p.mp3'")
    open("video/audlist.txt", "w").write("\n".join(aud) + "\n")
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", "video/audlist.txt",
         "-c:a", "libmp3lame", "-q:a", "4", "video/narration.mp3"])
    # build one exact-length clip per segment; skip the loading wait so each
    # clip starts right when the result appears (timings logged by record.js);
    # freeze the last frame if the remaining footage is shorter than the audio
    import json as _json
    timings = {}
    try:
        timings = _json.load(open("video/raw/timings.json"))
    except Exception:
        pass
    def skip_for(src, mark):
        base = os.path.basename(src).replace(".webm", "")
        m = timings.get(base, {})
        if mark in m:
            return max(0.0, m[mark] - 1.0)
        return 0.0
    inputs = []
    filters = []
    for i, ((src, kind, mark, _), vd) in enumerate(zip(SEGMENTS, vdurs)):
        out = f"video/clip{i + 1}.mp4"
        if kind == "slide":
            run(["ffmpeg", "-y", "-v", "error", "-loop", "1", "-t", f"{vd:.3f}",
                 "-i", src, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
                 "-preset", "medium", "-crf", "20", out])
            print(f"clip{i + 1}: slide -> {vd:.2f}s")
        else:
            srcdur = ffprobe_dur(src)
            skip = skip_for(src, mark)
            avail = srcdur - skip
            if avail >= vd:
                run(["ffmpeg", "-y", "-v", "error", "-ss", f"{skip:.3f}", "-i", src,
                     "-t", f"{vd:.3f}",
                     "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
                     "-preset", "medium", "-crf", "20", "-an", out])
            else:
                # freeze last frame to reach target length
                run(["ffmpeg", "-y", "-v", "error", "-ss", f"{skip:.3f}", "-i", src,
                     "-vf", f"tpad=stop_duration={vd - avail:.3f}:stop_mode=clone",
                     "-t", f"{vd:.3f}",
                     "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
                     "-preset", "medium", "-crf", "20", "-an", out])
            print(f"clip{i + 1}: src {srcdur:.2f}s skip {skip:.2f}s avail {avail:.2f}s -> {vd:.2f}s")
        inputs += ["-i", out]
        filters.append(f"[{i}:v]")
    filt = "".join(filters) + f"concat=n={len(SEGMENTS)}:v=1:a=0[v]"
    run(["ffmpeg", "-y", "-v", "error"] + inputs + ["-i", "video/narration.mp3",
         "-filter_complex", filt, "-map", "[v]", "-map", f"{len(SEGMENTS)}:a",
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
         "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
         "-shortest", "video/sortsense-demo.mp4"])
    vdur = ffprobe_dur("video/sortsense-demo.mp4")
    print("VIDEO:", round(vdur, 2), "s (limit 120-180s)")
    print("size:", os.path.getsize("video/sortsense-demo.mp4"), "bytes")

if __name__ == "__main__":
    main()
