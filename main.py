import cv2
import time
import re
import requests
import numpy as np
from ultralytics import YOLO
import easyocr

# ================= CONFIG =================
RTMP_URL = "rtmp://127.0.0.1:1935/live/iphone_cam"
BACKEND_API = "http://localhost:3000/api/parking-sessions/process-parking"
API_KEY = "YOUR_SECRET_KEY"

YOLO_MODEL_PATH = "best.pt"
CONF_THRESHOLD = 0.5

YOLO_SKIP = 3           # chạy YOLO mỗi 3 frame
OCR_INTERVAL = 0.8      # OCR mỗi 0.8s
SEND_INTERVAL = 2.0     # gửi backend mỗi 2s

# ================= REGEX =================
VN_PLATE_REGEX = re.compile(
    r"\b\d{2}[A-Z]\d?[- ]?\d{3}[.\-]?\d{2}\b"
)

CHAR_MAP = {
    "O": "0", "Q": "0", "D": "0",
    "I": "1", "L": "1",
    "Z": "2", "S": "5",
    "B": "8", "G": "6"
}

def normalize_plate(text: str) -> str:
    text = text.upper()
    text = re.sub(r"[^A-Z0-9.-]", "", text)
    return "".join(CHAR_MAP.get(c, c) for c in text)

def extract_vn_plate(text: str):
    text = normalize_plate(text)
    match = VN_PLATE_REGEX.search(text)
    return match.group(0) if match else None

# ================= RTMP FLUSH =================
def read_latest_frame(cap, skip=4):
    for _ in range(skip):
        cap.grab()
    return cap.retrieve()

# ================= LOAD MODELS =================
print("🚀 Loading YOLO...")
model = YOLO(YOLO_MODEL_PATH)

print("🔤 Loading EasyOCR...")
ocr = easyocr.Reader(
    ["en"],
    gpu=False,
)

# ================= OPEN STREAM =================
cap = cv2.VideoCapture(RTMP_URL)
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

if not cap.isOpened():
    raise RuntimeError("❌ Cannot open RTMP stream")

print("✅ RTMP connected")

# ================= STATE =================
frame_count = 0
last_ocr_time = 0
last_sent_time = 0
last_plate_text = ""

# ================= MAIN LOOP =================
while True:
    ret, frame = read_latest_frame(cap)
    if not ret:
        time.sleep(0.05)
        continue

    frame = cv2.resize(frame, (960, 540))
    frame_count += 1

    # ---- SKIP YOLO ----
    if frame_count % YOLO_SKIP != 0:
        cv2.imshow("🚗 License Plate Detection", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
        continue

    # ---- YOLO ----
    results = model(frame, conf=CONF_THRESHOLD, verbose=False)

    for r in results:
        if r.boxes is None:
            continue

        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            plate_img = frame[y1:y2, x1:x2]
            if plate_img.size == 0:
                continue

            h, w = plate_img.shape[:2]
            if w < 120 or h < 40:
                continue

            # ---- OCR INTERVAL ----
            if time.time() - last_ocr_time < OCR_INTERVAL:
                continue

            # ---- PREPROCESS ----
            plate_img = cv2.resize(plate_img, None, fx=2, fy=2)
            gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
            gray = cv2.bilateralFilter(gray, 11, 17, 17)

            ocr_results = ocr.readtext(
                gray,
                allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-"
            )

            raw_text = ""
            for (_, text, conf) in ocr_results:
                if conf > 0.4:
                    raw_text += text

            plate_number = extract_vn_plate(raw_text)
            last_ocr_time = time.time()

            if not plate_number:
                continue

            now = time.time()

            # ---- SEND BACKEND ----
            if (
                plate_number != last_plate_text and
                now - last_sent_time > SEND_INTERVAL
            ):
                payload = {
                    "plate": plate_number,
                    "timestamp": int(now)
                }

                try:
                    res = requests.post(
                        BACKEND_API,
                        json=payload,
                        headers={
                            "Content-Type": "application/json",
                            "x-api-key": API_KEY
                        },
                        timeout=1.5
                    )
                    print(f"📤 Sent: {plate_number} | {res.status_code}")
                    last_plate_text = plate_number
                    last_sent_time = now

                except Exception as e:
                    print("❌ Backend error:", e)

            # ---- DRAW ----
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(
                frame,
                plate_number,
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (0, 255, 0),
                2
            )

    cv2.imshow("🚗 License Plate Detection", frame)
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# ================= CLEANUP =================
cap.release()
cv2.destroyAllWindows()
