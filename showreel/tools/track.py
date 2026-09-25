"""Face + hand tracking for every frame of each clip (MediaPipe Tasks).

Writes build/track/clip_<id>.json:
  {fps, w, h, n, frames: [{f: bool, box:[x0,y0,x1,y1], le:[x,y], re:[x,y], nose:[x,y],
   mouth:[x,y], mo: open-ratio, yaw, hands:[[x0,y0,x1,y1,n_visible_tips]], mesh?: [...]}]}
Coordinates are normalised 0..1 in source-frame space.
Pass --mesh c:start:end to also store the 478-point mesh for a source-time window.
"""
import json, sys, os
import cv2, numpy as np
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions

MODELS = "build/models"
os.makedirs("build/track", exist_ok=True)

def mk_face():
    return vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=f"{MODELS}/face_landmarker.task"),
        running_mode=vision.RunningMode.VIDEO, num_faces=1,
        min_face_detection_confidence=0.4, min_tracking_confidence=0.4,
        output_face_blendshapes=True))

def mk_hand():
    return vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=f"{MODELS}/hand_landmarker.task"),
        running_mode=vision.RunningMode.VIDEO, num_hands=2,
        min_hand_detection_confidence=0.4, min_tracking_confidence=0.4))

def r3(v): return [round(float(x), 4) for x in v]

def track(cid, mesh_windows):
    cap = cv2.VideoCapture(f"footage/clip_{cid}.mp4")
    fps = cap.get(cv2.CAP_PROP_FPS); w = int(cap.get(3)); h = int(cap.get(4))
    face, hand = mk_face(), mk_hand()
    frames = []; i = 0
    while True:
        ok, bgr = cap.read()
        if not ok: break
        ts = int(round(i * 1000 / fps))
        img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
        fr = face.detect_for_video(img, ts); hr = hand.detect_for_video(img, ts)
        d = {"f": False}
        if fr.face_landmarks:
            L = np.array([[p.x, p.y] for p in fr.face_landmarks[0]])
            d["f"] = True
            d["box"] = r3([L[:, 0].min(), L[:, 1].min(), L[:, 0].max(), L[:, 1].max()])
            d["le"] = r3(L[468:473].mean(0)) if len(L) > 472 else r3(L[[33, 133]].mean(0))
            d["re"] = r3(L[473:478].mean(0)) if len(L) > 477 else r3(L[[362, 263]].mean(0))
            d["nose"] = r3(L[1]); d["mouth"] = r3(L[[13, 14]].mean(0))
            d["chin"] = r3(L[152]); d["brow"] = r3(L[9])
            d["lcheek"] = r3(L[205]); d["rcheek"] = r3(L[425])
            face_h = np.linalg.norm(L[10] - L[152]) + 1e-6
            d["mo"] = round(float(np.linalg.norm(L[13] - L[14]) / face_h), 4)
            d["yaw"] = round(float((L[1, 0] - (L[234, 0] + L[454, 0]) / 2) / (abs(L[454, 0] - L[234, 0]) + 1e-6)), 3)
            if fr.face_blendshapes:
                bs = {b.category_name: b.score for b in fr.face_blendshapes[0]}
                pair = lambda k: (bs.get(k + "Left", 0) + bs.get(k + "Right", 0)) / 2
                d["bs"] = {k: round(float(v), 3) for k, v in {
                    "jaw": bs.get("jawOpen", 0), "smile": pair("mouthSmile"), "blink": pair("eyeBlink"),
                    "brow": bs.get("browInnerUp", 0), "squint": pair("eyeSquint"), "pucker": bs.get("mouthPucker", 0),
                    "funnel": bs.get("mouthFunnel", 0), "cheek": pair("cheekSquint"), "browDown": pair("browDown"),
                }.items()}
            t = i / fps
            if any(a <= t <= b for a, b in mesh_windows):
                d["mesh"] = [round(float(v), 4) for v in L[:468].reshape(-1)]
        hands = []
        for hl in hr.hand_landmarks or []:
            H = np.array([[p.x, p.y] for p in hl])
            hands.append(r3([H[:, 0].min(), H[:, 1].min(), H[:, 0].max(), H[:, 1].max()]) + [r3(H[[4, 8, 12, 16, 20]].reshape(-1))])
        if hands: d["hands"] = hands
        frames.append(d); i += 1
    cap.release()
    json.dump({"fps": fps, "w": w, "h": h, "n": len(frames), "frames": frames}, open(f"build/track/clip_{cid}.json", "w"), separators=(",", ":"))
    got = sum(1 for f in frames if f["f"]); gh = sum(1 for f in frames if "hands" in f)
    print(f"clip {cid}: {len(frames)} frames @ {fps}fps, face in {got}, hands in {gh}", flush=True)

if __name__ == "__main__":
    args = sys.argv[1:]
    mesh = {}
    ids = []
    for a in args:
        if a.startswith("--mesh="):
            c, s, e = a[7:].split(":"); mesh.setdefault(c, []).append((float(s), float(e)))
        else: ids.append(a)
    for c in ids or list("abcde"):
        track(c, mesh.get(c, []))
