import base64

import cv2
import numpy as np

from config import settings


def encode_frame_to_base64(
    frame: np.ndarray,
    max_width: int | None = None,
    jpeg_quality: int | None = None,
) -> str:
    """Mã hóa frame BGR thành JPEG base64 (không prefix data-URL)."""
    width_limit = max_width or settings.capture_image_max_width
    quality = jpeg_quality or settings.capture_image_jpeg_quality

    height, width = frame.shape[:2]
    if width > width_limit:
        scale = width_limit / width
        frame = cv2.resize(
            frame,
            (width_limit, int(height * scale)),
            interpolation=cv2.INTER_AREA,
        )

    success, buffer = cv2.imencode(
        ".jpg",
        frame,
        [int(cv2.IMWRITE_JPEG_QUALITY), quality],
    )
    if not success:
        raise ValueError("Failed to encode frame to JPEG")

    return base64.b64encode(buffer.tobytes()).decode("utf-8")
