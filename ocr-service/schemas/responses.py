from pydantic import BaseModel, Field


class CapturePlateSuccessResponse(BaseModel):
    success: bool = True
    plate: str
    candidates: list[str] = Field(..., description="Kết quả OCR từng frame trước khi vote")
    capture_image_base64: str = Field(
        ...,
        description="JPEG base64 của frame thắng (có khung biển số)",
    )


class CapturePlateErrorResponse(BaseModel):
    success: bool = False
    message: str
