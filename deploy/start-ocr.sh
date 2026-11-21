#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/../ocr-service"
source .venv/bin/activate
exec uvicorn app:app --host 127.0.0.1 --port 8000
