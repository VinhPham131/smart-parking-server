import cv2
import numpy as np


def preprocess_plate_image(plate_bgr: np.ndarray) -> np.ndarray:
    """Tiền xử lý ảnh biển số trước khi đưa vào EasyOCR."""
    resized = cv2.resize(plate_bgr, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    return cv2.bilateralFilter(gray, 11, 17, 17)
