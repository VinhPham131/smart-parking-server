import logging
import threading
import time
from typing import TYPE_CHECKING

import cv2
import numpy as np

from config import settings

if TYPE_CHECKING:
    pass

logger = logging.getLogger(__name__)


class CameraService:
    """
    Mở webcam một lần khi startup.
    Background thread liên tục cập nhật latest_frame — không mở/đóng camera theo request.
    """

    def __init__(self) -> None:
        self._cap: cv2.VideoCapture | None = None
        self._latest_frame: np.ndarray | None = None
        self._frame_lock = threading.Lock()
        self._running = False
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if self._running:
            logger.warning("CameraService already started.")
            return

        logger.info("Opening camera device index=%s", settings.camera_device_index)
        self._cap = cv2.VideoCapture(settings.camera_device_index)
        self._cap.set(cv2.CAP_PROP_BUFFERSIZE, settings.camera_buffer_size)

        if not self._cap.isOpened():
            raise RuntimeError(
                f"Cannot open camera at device index {settings.camera_device_index}"
            )

        self._running = True
        self._thread = threading.Thread(
            target=self._capture_loop,
            name="camera-frame-reader",
            daemon=True,
        )
        self._thread.start()
        logger.info("Camera started; background frame reader running.")

    def stop(self) -> None:
        logger.info("Stopping camera service...")
        self._running = False

        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=3.0)

        if self._cap is not None:
            self._cap.release()
            self._cap = None

        with self._frame_lock:
            self._latest_frame = None

        logger.info("Camera stopped.")

    def _capture_loop(self) -> None:
        while self._running and self._cap is not None:
            ret, frame = self._cap.read()
            if not ret:
                time.sleep(0.02)
                continue

            with self._frame_lock:
                self._latest_frame = frame.copy()

    def get_latest_frame(self) -> np.ndarray | None:
        with self._frame_lock:
            if self._latest_frame is None:
                return None
            return self._latest_frame.copy()

    def _flush_camera_buffer(self) -> None:
        """Bỏ frame cũ trong buffer driver để lấy ảnh mới hơn cho frame tiếp theo."""
        if self._cap is None:
            return
        for _ in range(settings.camera_grab_flush_count):
            self._cap.grab()

    def capture_frames(self, count: int | None = None) -> list[np.ndarray]:
        """
        Lấy N frame từ buffer. interval=0 thì flush grab giữa các lần chụp.
        """
        frame_count = count or settings.frame_capture_count
        interval_sec = settings.frame_capture_interval_ms / 1000.0
        frames: list[np.ndarray] = []

        for i in range(frame_count):
            if i > 0:
                if interval_sec > 0:
                    time.sleep(interval_sec)
                else:
                    self._flush_camera_buffer()

            frame = self.get_latest_frame()
            if frame is not None:
                frames.append(frame)
            else:
                logger.warning("Frame %s/%s: no frame available yet.", i + 1, frame_count)

        return frames

    @property
    def is_ready(self) -> bool:
        with self._frame_lock:
            return self._latest_frame is not None
