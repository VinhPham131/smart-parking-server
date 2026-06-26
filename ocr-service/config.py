from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Parking Plate OCR Service"
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "INFO"

    camera_device_index: int = 0
    camera_buffer_size: int = 1
    camera_grab_flush_count: int = 3
    frame_capture_count: int = 2
    frame_capture_interval_ms: int = 0

    yolo_model_path: str = str(_ROOT / "best.pt")
    yolo_conf_threshold: float = 0.5
    yolo_imgsz: int = 640
    yolo_max_frame_width: int = 960
    min_plate_width: int = 120
    min_plate_height: int = 40
    early_exit_votes: int = 2

    ocr_languages: list[str] = ["en"]
    ocr_gpu: bool = False
    ocr_min_confidence: float = 0.4
    ocr_allowlist: str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-"

    capture_image_max_width: int = 960
    capture_image_jpeg_quality: int = 75


settings = Settings()
