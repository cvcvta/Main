"""Tighten the VO take and write timeline.json (phrase + word timings in final-video seconds).

Usage: python timeline.py <vo.mp3> <out_dir>
Speech segments below were measured on take A with
  ffmpeg -af silencedetect=n=-40dB:d=0.15
and mapped 1:1 to the phrases in PHRASES.
"""
import json, subprocess, sys, re
from pathlib import Path

SEGMENTS = [
    (0.00, 1.57), (1.86, 3.16), (3.49, 5.57), (5.87, 6.37), (6.59, 8.25),
    (8.61, 9.99), (10.27, 11.37), (11.74, 15.10), (15.40, 16.02), (16.19, 16.68),
    (16.88, 18.14), (18.35, 19.63), (19.92, 20.52), (20.69, 22.38), (22.75, 24.45),
    (24.77, 25.82), (26.10, 27.28), (27.57, 29.31), (29.66, 31.40), (31.66, 34.71),
    (35.08, 37.30), (37.59, 40.53),
]
PHRASES = [
    "Still trying to hire a marketer?",
    "Mo starts today.",
    "Add up what one hire really costs you.",
    "Salary.",
    "Benefits. Months of ramp-up.",
    "And when they quit mid-campaign?",
    "Back to square one.",
    "Persona OS puts a whole marketing team into one AI.",
    "A designer.",
    "A writer.",
    "An SEO specialist.",
    "Social and ads.",
    "Every month:",
    "planned, made, and posted.",
    "And here's what no hire can match.",
    "Start with your website.",
    "Add social when you're ready.",
    "Go full CMO when you grow.",
    "On the job, twenty-four seven.",
    "No raises. No complaints. No agency to chase.",
    "If your marketing keeps getting pushed to next week...",
    "Tap below, and hire Mo from forty-nine dollars a month.",
]
# Gap kept after each phrase (seconds, pre-tempo). Longer gaps where the scene changes.
GAP_AFTER = {1: .22, 4: .14, 6: .24, 7: .14, 11: .14, 13: .2, 14: .18, 17: .14, 18: .14, 19: .2, 20: .2}
DEFAULT_GAP = 0.07
PAD = 0.04          # keep a hair of room around each segment so consonants aren't clipped
TEMPO = 1.15        # final speed-up
LEAD_IN = 0.15      # silence before first word (post-tempo)
TAIL = 1.35         # end-card hold after last word (post-tempo)


def syllables(word):
    w = re.sub(r"[^a-z]", "", word.lower())
    if not w:
        return 1
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and n > 1:
        n -= 1
    return max(1, n)


def main(src, out):
    out = Path(out); out.mkdir(parents=True, exist_ok=True)
    parts, t, timeline = [], 0.0, []
    for i, ((a, b), text) in enumerate(zip(SEGMENTS, PHRASES)):
        a2, b2 = max(0, a - PAD), b + PAD
        dur = b2 - a2
        gap = GAP_AFTER.get(i, DEFAULT_GAP)
        parts.append((a2, b2, gap))
        start = LEAD_IN + (t + PAD) / TEMPO
        end = LEAD_IN + (t + dur - PAD) / TEMPO
        words = text.split()
        weights = [syllables(w) + 0.6 for w in words]
        tot, acc, wt = sum(weights), 0.0, []
        for w, wgt in zip(words, weights):
            wt.append({"w": w, "t": round(start + (end - start) * acc / tot, 3),
                       "e": round(start + (end - start) * (acc + wgt) / tot, 3)})
            acc += wgt
        timeline.append({"i": i, "text": text, "start": round(start, 3), "end": round(end, 3), "words": wt})
        t += dur + gap
    total = LEAD_IN + t / TEMPO + TAIL
    # Build the tightened VO with ffmpeg: trim each segment, add its gap, concat, apply tempo.
    fl, labels = [], []
    for k, (a2, b2, gap) in enumerate(parts):
        fl.append(f"[0:a]atrim={a2:.3f}:{b2:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.015,"
                  f"afade=t=out:st={b2 - a2 - 0.02:.3f}:d=0.02,apad=pad_dur={gap:.3f}[s{k}]")
        labels.append(f"[s{k}]")
    fl.append("".join(labels) + f"concat=n={len(parts)}:v=0:a=1,atempo={TEMPO},"
              f"adelay={int(LEAD_IN * 1000)}:all=1,apad=whole_dur={total:.3f},"
              "aformat=sample_rates=48000:channel_layouts=stereo[vo]")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-filter_complex", ";".join(fl),
                    "-map", "[vo]", str(out / "vo_tight.wav")], check=True)
    (out / "timeline.json").write_text(json.dumps({"duration": round(total, 3), "fps": 30,
                                                     "phrases": timeline}, indent=1))
    print(f"total {total:.2f}s")
    for p in timeline:
        print(f"{p['i']:>2} {p['start']:6.2f}-{p['end']:6.2f}  {p['text']}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
