import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from config import settings
from dependencies import get_container
from schemas.responses import CapturePlateErrorResponse, CapturePlateSuccessResponse

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    container = get_container()
    logger.info("Starting %s...", settings.app_name)
    try:
        container.camera_service.start()
        logger.info("All services started successfully.")
    except Exception as exc:
        logger.exception("Startup failed: %s", exc)
        raise

    yield

    logger.info("Shutting down...")
    container.camera_service.stop()
    logger.info("Shutdown complete.")


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health() -> dict:
    container = get_container()
    return {
        "status": "ok",
        "camera_ready": container.camera_service.is_ready,
    }


@app.post(
    "/capture-plate",
    response_model=None,
    responses={
        200: {"description": "Nhận diện thành công hoặc không tìm thấy biển số"},
    },
)
async def capture_plate() -> CapturePlateSuccessResponse | CapturePlateErrorResponse:
    """
    RFID trigger từ NestJS → gọi endpoint này một lần.
    Không OCR liên tục; chỉ xử lý khi có request.
    """
    container = get_container()

    try:
        result = container.plate_recognition_service.capture_and_recognize()
    except Exception as exc:
        logger.exception("Unexpected error during plate capture: %s", exc)
        raise HTTPException(
            status_code=500,
            detail={"success": False, "message": "Internal server error"},
        ) from exc

    if result.get("success"):
        return CapturePlateSuccessResponse(
            plate=result["plate"],
            candidates=result["candidates"],
            capture_image_base64=result["capture_image_base64"],
        )

    return CapturePlateErrorResponse(message=result.get("message", "Plate not found"))


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception for %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "Internal server error"},
    )
