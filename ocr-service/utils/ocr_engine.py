import logging
from typing import Protocol

import easyocr
import numpy as np

from config import settings
from utils.plate_normalizer import extract_vietnam_plate

logger = logging.getLogger(__name__)


class OcrEngineProtocol(Protocol):
    def read_plate(self, plate_image: np.ndarray) -> str | None: ...


class EasyOcrEngine:
    """Wrapper EasyOCR — chỉ khởi tạo một lần khi startup."""

    def __init__(self) -> None:
        logger.info("Loading EasyOCR reader (languages=%s, gpu=%s)...", settings.ocr_languages, settings.ocr_gpu)
        self._reader = easyocr.Reader(
            settings.ocr_languages,
            gpu=settings.ocr_gpu,
        )
        logger.info("EasyOCR loaded.")

    def read_plate(self, plate_image: np.ndarray) -> str | None:
        results = self._reader.readtext(
            plate_image,
            allowlist=settings.ocr_allowlist,
        )

        raw_text = ""
        for _bbox, text, confidence in results:
            if confidence >= settings.ocr_min_confidence:
                raw_text += text

        if not raw_text.strip():
            return None

        plate = extract_vietnam_plate(raw_text)
        if plate:
            logger.debug("OCR raw=%r -> plate=%s", raw_text, plate)
        return plate
