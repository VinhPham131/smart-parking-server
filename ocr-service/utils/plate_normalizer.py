import re

CHAR_MAP: dict[str, str] = {
    "O": "0",
    "Q": "0",
    "D": "0",
    "I": "1",
    "L": "1",
    "Z": "2",
    "S": "5",
    "B": "8",
    "G": "6",
}

# Biển số Việt Nam: 51A-123.45, 51A12345, 81A-12345, ...
VN_PLATE_REGEX = re.compile(
    r"\b\d{2}[A-Z]\d?[- ]?\d{3}[.\-]?\d{2,3}\b"
)

# Dạng không dấu: 81A12345
VN_PLATE_COMPACT_REGEX = re.compile(r"^\d{2}[A-Z]\d{4,6}$")


def normalize_plate_text(text: str) -> str:
    """Chuẩn hóa ký tự OCR hay nhầm (O→0, I→1, ...)."""
    text = text.upper()
    text = re.sub(r"[^A-Z0-9.\-]", "", text)
    return "".join(CHAR_MAP.get(char, char) for char in text)


def extract_vietnam_plate(text: str) -> str | None:
    """Trích xuất biển số VN hợp lệ từ chuỗi OCR thô."""
    normalized = normalize_plate_text(text)
    if not normalized:
        return None

    match = VN_PLATE_REGEX.search(normalized)
    if match:
        return compact_plate(match.group(0))

    compact = re.sub(r"[-.\s]", "", normalized)
    if VN_PLATE_COMPACT_REGEX.match(compact):
        return compact

    return None


def compact_plate(plate: str) -> str:
    """Chuẩn hóa về dạng không dấu: 81A12345."""
    return re.sub(r"[-.\s]", "", plate.upper())
