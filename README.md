# Smart Parking Backend

Backend API for a smart parking system (Graduation Project). Built with **NestJS**, connected to PostgreSQL, Redis, MQTT (RFID gate), and a Python **OCR** microservice for license plate verification at check-in/check-out.

> **Frontend:** The React UI lives in a separate repo — [VinhPham131/smart-parking-ui](https://github.com/VinhPham131/smart-parking-ui).

## Overview

The system supports:

- **Parking management**: areas, slots, sessions, history
- **RFID + OCR**: gate device sends UID via MQTT → backend calls OCR service to capture plate → matches against registered vehicle
- **Reservations & payments**: booking, hourly fees, member wallet
- **Realtime**: WebSocket (parking status, notifications)
- **AI Agent** (admin): data lookup chatbot via Ollama
- **Authentication**: JWT with `user` / `admin` roles

```text
[RFID Gate] --MQTT--> [NestJS Backend] --HTTP--> [OCR Service + Camera]
                           |
                    PostgreSQL / Redis
                           |
                    [Frontend / Mobile]
```

## Requirements

| Component | Suggested version |
|-----------|-------------------|
| Node.js | 22+ |
| npm | 10+ |
| PostgreSQL | 14+ |
| Redis | 6+ (can be disabled for local dev) |
| MQTT Broker | Mosquitto (can be disabled for local dev) |
| Python OCR service | See [ocr-service/README.md](./ocr-service/README.md) |
| Ollama | Optional — required only for AI Agent |

## Project structure

```text
backend/
├── src/                    # NestJS source
│   ├── auth/               # Register, login, JWT
│   ├── parking-areas/      # Areas & slots
│   ├── parking-sessions/   # Check-in/out, RFID events
│   ├── parking-history/    # Parking history
│   ├── vehicles/           # Vehicles
│   ├── rfid/               # RFID cards
│   ├── reservations/       # Reservations
│   ├── payments/           # Payments & fee calculation
│   ├── mqtt/               # RFID gate listener
│   ├── camera/             # OCR service HTTP client
│   ├── gateways/           # WebSocket realtime
│   ├── ai-agents/          # Admin chatbot (Ollama)
│   └── ...
├── ocr-service/            # License plate recognition microservice
├── best.pt                 # YOLO model (not committed — add manually)
└── Dockerfile
```

## Setup

### 1. Clone & install dependencies

```bash
cd backend
npm install
```

### 2. Environment variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=3000

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=smart_parking
DB_POOL_MAX=30

# JWT
JWT_SECRET=your_jwt_secret_key

# Redis (set REDIS_ENABLED=false if Redis is not installed)
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
CACHE_TTL_SECONDS=60

# MQTT (set MQTT_ENABLED=false when no gate hardware is available)
MQTT_ENABLED=true

# OCR service
OCR_SERVICE_URL=http://localhost:8000
OCR_SERVICE_TIMEOUT_MS=30000

# Email (forgot password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM="Smart Parking <your@gmail.com>"
FRONTEND_URL=http://localhost:5173
```

### 3. Initialize database

Create a PostgreSQL database:

```sql
CREATE DATABASE smart_parking;
```

The schema syncs automatically on startup (`synchronize: true`). Migrations are optional:

```bash
npm run migration:run
```

### 4. Run OCR service (when testing RFID + camera)

```bash
cd ocr-service
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

See [ocr-service/README.md](./ocr-service/README.md) for details.

### 5. Run backend

```bash
# Development (hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

API base URL: `http://localhost:3000/api`

## Main API modules

All routes (except those marked `@Public()`) require the header `Authorization: Bearer <token>`.

| Module | Prefix | Description |
|--------|--------|-------------|
| Auth | `/api/auth` | register, login, forgot/reset password |
| Users | `/api/users` | Profile, user management (admin) |
| Vehicles | `/api/vehicles` | Vehicle registration |
| Parking Areas | `/api/parking-areas` | Parking areas |
| Parking Sessions | `/api/parking-sessions` | Active sessions |
| Parking History | `/api/parking-history` | History |
| RFID | `/api/rfid` | RFID card management |
| RFID Requests | `/api/rfid-requests` | Card issuance requests |
| Reservations | `/api/reservations` | Reservations |
| Payments | `/api/payments` | Payments |
| Notifications | `/api/notifications` | Notifications |
| Analytics | `/api/analytics` | Statistics (admin) |
| AI Agent | `/api/ai-agent` | Admin chat (Ollama) |
| QR Code | `/api/qr-code` | QR codes |

## RFID check-in flow

1. Gate device publishes MQTT topic `gate/checkin/rfid` with `{ uid, area }`
2. Backend looks up RFID → vehicle → registered license plate
3. Calls `POST /capture-plate` on the OCR service
4. Compares detected plate with registered plate
5. Creates parking session, opens gate via MQTT `gate/checkin/command`

Check-out follows the same pattern via topic `gate/checkout/rfid`.

## AI Agent (optional)

Requires [Ollama](https://ollama.com/) running locally with model `llama3:8b`:

```bash
ollama pull llama3:8b
ollama serve
```

Endpoint: `POST /api/ai-agent/chat` (requires `admin` role).


> The OCR service and YOLO model must run separately (or in a separate container) because they depend on camera/GPU access.

## Useful scripts

```bash
npm run start:dev          # Dev server
npm run lint               # ESLint
npm run test               # Unit tests
npm run migration:run      # Run migrations
npm run migration:generate # Generate a new migration
```

## Development notes

- **No camera/MQTT**: set `MQTT_ENABLED=false` and test APIs manually; the RFID flow requires both MQTT and the OCR service.
- **No Redis**: set `REDIS_ENABLED=false` — cache falls back to in-memory.
- **YOLO model**: place `best.pt` in the `backend/` directory (see OCR README).
- WebSocket gateways authenticate clients using the same `JWT_SECRET`.

## Related

- [smart-parking-ui](https://github.com/VinhPham131/smart-parking-ui) — React + TypeScript + Vite frontend
- [ocr-service/README.md](./ocr-service/README.md) — License plate recognition (YOLO + EasyOCR)
