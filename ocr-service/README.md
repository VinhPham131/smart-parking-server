# Parking Plate OCR Service

**FastAPI** microservice for on-demand license plate recognition. Called by the NestJS backend on RFID check-in/check-out events at the gate — it does **not** run OCR continuously; it only processes when an HTTP request is received.

## Role in the system

```text
RFID scan → NestJS (MQTT) → POST /capture-plate → OCR Service
                                                      ↓
                                            Camera → YOLO → EasyOCR
                                                      ↓
                              Returns plate + base64 image → Backend matches registered plate
```

The backend stores captured images in `parking_sessions.check_in_capture_image` / `check_out_capture_image`.

## Tech stack

- **FastAPI** + Uvicorn
- **OpenCV** — read frames from webcam/USB camera
- **Ultralytics YOLO** (`best.pt`) — detect license plate region
- **EasyOCR** — read characters on the plate
- **Multi-frame voting** — capture multiple frames and pick the most consistent result for better accuracy

## Requirements

| Component | Notes |
|-----------|-------|
| Python | 3.10+ |
| Webcam / USB camera | Mounted at entry/exit gate |
| `best.pt` model file | Place at `backend/best.pt` (default) |

On first run, EasyOCR downloads language models — an internet connection is required.

## Installation

```bash
cd ocr-service
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Place the YOLO model file:

```text
backend/
├── best.pt          ← YOLO model (required)
└── ocr-service/
```

Or set a custom path via the `YOLO_MODEL_PATH` environment variable.

## Running the service

```bash
cd ocr-service
source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Or using settings from `config.py`:

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

The service starts the camera in the `lifespan` hook — if the camera cannot be opened, `/health` will report `camera_ready: false`.

## API

### `GET /health`

Check service and camera status.

```json
{
  "status": "ok",
  "camera_ready": true
}
```

### `POST /capture-plate`

Capture a frame, recognize the license plate, and return the result.

**Success (200):**

```json
{
  "success": true,
  "plate": "30A-12345",
  "candidates": ["30A-12345", "30A12345"],
  "capture_image_base64": "<JPEG base64>"
}
```

**Plate not found (200):**

```json
{
  "success": false,
  "message": "Plate not found"
}
```

## Environment variables

Create `ocr-service/.env` (optional) or export variables directly:

| Variable | Default | Description |
|----------|---------|-------------|
| `CAMERA_DEVICE_INDEX` | `0` | Webcam index (0 = default camera) |
| `YOLO_MODEL_PATH` | `../best.pt` | Path to YOLO model |
| `YOLO_CONF_THRESHOLD` | `0.5` | Detection confidence threshold |
| `YOLO_IMGSZ` | `640` | YOLO inference image size |
| `YOLO_MAX_FRAME_WIDTH` | `960` | Resize frame width before detection |
| `FRAME_CAPTURE_COUNT` | `2` | Number of frames to capture for voting |
| `FRAME_CAPTURE_INTERVAL_MS` | `0` | Delay between frames (ms) |
| `CAMERA_GRAB_FLUSH_COUNT` | `3` | Camera buffer flushes between frames |
| `EARLY_EXIT_VOTES` | `2` | Stop early when enough matching votes |
| `OCR_GPU` | `false` | Enable GPU for EasyOCR (keep `false` on Mac) |
| `OCR_MIN_CONFIDENCE` | `0.4` | OCR confidence threshold |
| `LOG_LEVEL` | `INFO` | Log level |

## NestJS integration

In the backend `.env`:

```env
OCR_SERVICE_URL=http://localhost:8000
OCR_SERVICE_TIMEOUT_MS=30000
```

The backend calls `CameraService.capturePlate()` → `POST {OCR_SERVICE_URL}/capture-plate`.

When developing **without a camera**, you can skip the RFID flow or mock responses — the OCR service must be running with a ready camera for end-to-end testing.

## Source structure

```text
ocr-service/
├── app.py                          # FastAPI routes
├── config.py                       # Settings (pydantic-settings)
├── dependencies.py                 # DI container
├── services/
│   ├── camera_service.py           # Read frames from camera
│   ├── plate_detector.py           # YOLO detection
│   └── plate_recognition_service.py # Orchestration + voting
├── utils/
│   ├── image_preprocess.py
│   ├── image_encode.py
│   ├── ocr_engine.py
│   └── plate_normalizer.py
└── schemas/responses.py
```

## Troubleshooting

| Symptom | Suggestion |
|---------|------------|
| `camera_ready: false` | Check camera permissions, try `CAMERA_DEVICE_INDEX=1` |
| `Connection refused` from NestJS | Ensure uvicorn is running on port 8000 |
| Plate not detected | Lower `YOLO_CONF_THRESHOLD`, increase `FRAME_CAPTURE_COUNT` |
| Slow first request | EasyOCR downloads models on first run — expected |
| Missing `best.pt` error | Copy model to `backend/best.pt` or set `YOLO_MODEL_PATH` |

## Related

- [Backend README](../README.md) — Main API, MQTT, overall configuration
