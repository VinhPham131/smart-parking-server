from functools import lru_cache

from services.camera_service import CameraService
from services.plate_detector import PlateDetector
from services.plate_recognition_service import PlateRecognitionService
from utils.ocr_engine import EasyOcrEngine


class AppContainer:
    """Dependency container — tránh global state rời rạc."""

    def __init__(self) -> None:
        self.camera_service = CameraService()
        self.plate_detector = PlateDetector()
        self.ocr_engine = EasyOcrEngine()
        self.plate_recognition_service = PlateRecognitionService(
            camera_service=self.camera_service,
            plate_detector=self.plate_detector,
            ocr_engine=self.ocr_engine,
        )


@lru_cache
def get_container() -> AppContainer:
    return AppContainer()
