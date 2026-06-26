import logging
from typing import TYPE_CHECKING

import cv2
import numpy as np
from ultralytics import YOLO

from config import settings

if TYPE_CHECKING:
    from ultralytics.engine.results import Results

logger = logging.getLogger(__name__)


class PlateDetector:
    """YOLO detect biển số — model chỉ load một lần khi startup."""

    def __init__(self) -> None:
        logger.info("Loading YOLO model from %s", settings.yolo_model_path)
        self._model = YOLO(settings.yolo_model_path)
        logger.info("YOLO model loaded.")

    def _prepare_inference_frame(self, frame: np.ndarray) -> tuple[np.ndarray, float]:
        """Resize frame cho YOLO; trả về (frame_inference, scale) với scale = width_inf / width_orig."""
        height, width = frame.shape[:2]
        max_width = settings.yolo_max_frame_width
        if width <= max_width:
            return frame, 1.0

        scale = max_width / width
        inference_frame = cv2.resize(
            frame,
            (max_width, int(height * scale)),
            interpolation=cv2.INTER_AREA,
        )
        return inference_frame, scale

    def _run_yolo(self, frame: np.ndarray) -> list["Results"]:
        return self._model(
            frame,
            conf=settings.yolo_conf_threshold,
            imgsz=settings.yolo_imgsz,
            verbose=False,
        )

    def _find_best_plate(
        self,
        results: list["Results"],
        original_frame: np.ndarray,
        inference_frame: np.ndarray,
        coord_scale: float,
    ) -> tuple[np.ndarray, tuple[int, int, int, int]] | None:
        min_width = max(1, int(settings.min_plate_width * coord_scale))
        min_height = max(1, int(settings.min_plate_height * coord_scale))
        inv_scale = 1.0 / coord_scale if coord_scale < 1.0 else 1.0

        best: tuple[np.ndarray, tuple[int, int, int, int], int] | None = None

        for result in results:
            if result.boxes is None:
                continue

            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                plate_img = inference_frame[y1:y2, x1:x2]

                if plate_img.size == 0:
                    continue

                height, width = plate_img.shape[:2]
                if width < min_width or height < min_height:
                    continue

                orig_box = (
                    int(x1 * inv_scale),
                    int(y1 * inv_scale),
                    int(x2 * inv_scale),
                    int(y2 * inv_scale),
                )
                orig_crop = original_frame[orig_box[1] : orig_box[3], orig_box[0] : orig_box[2]]
                if orig_crop.size == 0:
                    continue

                area = orig_crop.shape[0] * orig_crop.shape[1]
                if best is None or area > best[2]:
                    best = (orig_crop, orig_box, area)

        if best is None:
            return None

        return best[0], best[1]

    def detect_plate_crops(self, frame: np.ndarray) -> list[np.ndarray]:
        """Chạy YOLO trên frame, trả về danh sách ảnh crop biển số hợp lệ."""
        best = self.detect_best_plate_crop(frame)
        return [best] if best is not None else []

    def detect_best_plate_crop(self, frame: np.ndarray) -> np.ndarray | None:
        """Trả về crop biển số lớn nhất (thường gần camera nhất)."""
        result = self.detect_best_plate_with_box(frame)
        return result[0] if result else None

    def detect_best_plate_with_box(
        self,
        frame: np.ndarray,
    ) -> tuple[np.ndarray, tuple[int, int, int, int]] | None:
        """Trả về (crop, (x1, y1, x2, y2)) của biển số lớn nhất trên frame gốc."""
        inference_frame, scale = self._prepare_inference_frame(frame)
        results = self._run_yolo(inference_frame)
        return self._find_best_plate(results, frame, inference_frame, scale)
