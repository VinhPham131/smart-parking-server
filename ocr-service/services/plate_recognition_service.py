import logging
import time
from collections import Counter
from dataclasses import dataclass

import cv2
import numpy as np

from config import settings
from services.camera_service import CameraService
from services.plate_detector import PlateDetector
from utils.image_encode import encode_frame_to_base64
from utils.image_preprocess import preprocess_plate_image
from utils.ocr_engine import OcrEngineProtocol

logger = logging.getLogger(__name__)


@dataclass
class FrameRecognitionResult:
    plate_text: str
    frame: np.ndarray
    plate_crop: np.ndarray
    box: tuple[int, int, int, int]


class PlateRecognitionService:
    """Business logic: chụp frame → YOLO → OCR → vote → trả ảnh frame thắng."""

    def __init__(
        self,
        camera_service: CameraService,
        plate_detector: PlateDetector,
        ocr_engine: OcrEngineProtocol,
    ) -> None:
        self._camera = camera_service
        self._detector = plate_detector
        self._ocr = ocr_engine

    def capture_and_recognize(self) -> dict:
        t_start = time.perf_counter()

        if not self._camera.is_ready:
            logger.error("Camera not ready — no frames in buffer.")
            return {
                "success": False,
                "message": "Camera not ready",
            }

        t_capture_start = time.perf_counter()
        frames = self._camera.capture_frames(settings.frame_capture_count)
        t_capture_ms = (time.perf_counter() - t_capture_start) * 1000

        if not frames:
            return {
                "success": False,
                "message": "No frames captured",
            }

        candidates: list[str] = []
        recognitions: list[FrameRecognitionResult] = []
        t_yolo_total = 0.0
        t_ocr_total = 0.0

        for index, frame in enumerate(frames, start=1):
            t_yolo_start = time.perf_counter()
            detection = self._detector.detect_best_plate_with_box(frame)
            t_yolo_total += time.perf_counter() - t_yolo_start

            if detection is None:
                logger.debug("Frame %s: no plate detected by YOLO.", index)
                continue

            plate_crop, box = detection
            preprocessed = preprocess_plate_image(plate_crop)

            t_ocr_start = time.perf_counter()
            plate_text = self._ocr.read_plate(preprocessed)
            t_ocr_total += time.perf_counter() - t_ocr_start

            if plate_text:
                candidates.append(plate_text)
                recognitions.append(
                    FrameRecognitionResult(
                        plate_text=plate_text,
                        frame=frame,
                        plate_crop=plate_crop,
                        box=box,
                    )
                )
                logger.info("Frame %s: detected plate candidate=%s", index, plate_text)

                if self._should_early_exit(candidates):
                    logger.info(
                        "Early exit after frame %s: %s agreeing votes.",
                        index,
                        settings.early_exit_votes,
                    )
                    break
            else:
                logger.debug("Frame %s: OCR could not extract valid plate.", index)

        if not candidates:
            logger.warning(
                "Plate recognition failed: no valid candidates from %s frames.",
                len(frames),
            )
            return {
                "success": False,
                "message": "Plate not found",
            }

        vote_counter = Counter(candidates)
        winner, vote_count = vote_counter.most_common(1)[0]
        winning_recognition = next(
            (item for item in recognitions if item.plate_text == winner),
            recognitions[0],
        )

        annotated_frame = self._draw_plate_box(
            winning_recognition.frame,
            winning_recognition.box,
            winner,
        )
        capture_image_base64 = encode_frame_to_base64(annotated_frame)

        t_total_ms = (time.perf_counter() - t_start) * 1000
        logger.info(
            "Vote result: plate=%s votes=%s/%s candidates=%s | "
            "timing_ms capture=%.0f yolo=%.0f ocr=%.0f total=%.0f",
            winner,
            vote_count,
            len(candidates),
            candidates,
            t_capture_ms,
            t_yolo_total * 1000,
            t_ocr_total * 1000,
            t_total_ms,
        )

        return {
            "success": True,
            "plate": winner,
            "candidates": candidates,
            "capture_image_base64": capture_image_base64,
        }

    @staticmethod
    def _should_early_exit(candidates: list[str]) -> bool:
        if settings.early_exit_votes <= 1:
            return len(candidates) >= 1
        vote_count = Counter(candidates).most_common(1)[0][1]
        return vote_count >= settings.early_exit_votes

    @staticmethod
    def _draw_plate_box(
        frame: np.ndarray,
        box: tuple[int, int, int, int],
        plate_text: str,
    ) -> np.ndarray:
        output = frame.copy()
        x1, y1, x2, y2 = box
        cv2.rectangle(output, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(
            output,
            plate_text,
            (x1, max(y1 - 10, 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            (0, 255, 0),
            2,
        )
        return output
