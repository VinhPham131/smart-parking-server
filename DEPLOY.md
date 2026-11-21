# Deploy Smart Parking

```text
Trình duyệt ──HTTPS──> Vercel (frontend, *.vercel.app)
     │
     └──HTTPS──> Cloudflare ──tunnel──> [Mac này]
                                         ├─ Docker: backend :3000, redis, mosquitto :1883
                                         ├─ Postgres local :5432 (dùng chung DB dev)
                                         ├─ Ollama (llama3:8b) :11434   ← chạy native (GPU Metal)
                                         └─ OCR service :8000            ← chạy native (webcam)
ESP32 (LAN) ──MQTT──> <IP LAN của Mac>:1883
```

> Lệnh `docker` báo lỗi `docker-credential-desktop not found` thì chạy trước:
> `export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"`
> (hoặc thêm dòng đó vào `~/.zshrc`).

Alias cho gọn (chạy trong thư mục `backend/`):

```bash
alias dcp='docker compose -f docker-compose.prod.yml --env-file .env.prod'
```

---

## 1. Backend + DB (Docker)

File `deploy/mosquitto/passwd` không được commit. Trên máy mới, tạo lại (mật khẩu trùng `MQTT_PASSWORD` và firmware ESP32):

```bash
docker run --rm -v "$PWD/deploy/mosquitto:/m" eclipse-mosquitto:2 \
  mosquitto_passwd -b -c /m/passwd gate_device_1 '<mật khẩu>'
```

`.env.prod` đã được tạo sẵn với secret ngẫu nhiên (không commit file này).

```bash
dcp up -d --build        # build + chạy
dcp ps                   # xem trạng thái
dcp logs -f backend      # xem log
curl http://127.0.0.1:3000/api/health
```

- Không có container Postgres: backend dùng luôn Postgres đang chạy trên máy (DB `smart_parking_db`, cùng DB với dev) qua `host.docker.internal:5432`. Postgres local phải đang chạy trước khi `dcp up`.

## 2. Model chạy trên host

**Ollama** (bật app Ollama, hoặc `brew services start ollama`), rồi:

```bash
ollama pull llama3:8b
```

**OCR service** — chạy tay: `./deploy/start-ocr.sh`. Cho tự chạy khi đăng nhập:

```bash
cp deploy/com.smartparking.ocr.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.smartparking.ocr.plist
tail -f /tmp/smartparking-ocr.log
```

Lần đầu macOS sẽ hỏi quyền Camera — cho phép.

## 3. Cloudflare Tunnel (HTTPS cho backend)

### Cách A — có domain (khuyên dùng, URL cố định)

1. Có 1 domain (mua rẻ, hoặc `.id.vn` miễn phí cho người 18–23 tuổi qua chương trình của VNNIC nếu đủ điều kiện).
2. Cloudflare dashboard → **Add a site** → chọn gói Free → đổi nameserver ở nhà đăng ký domain sang 2 nameserver Cloudflare đưa. Chờ trạng thái **Active**.
3. **Zero Trust** → **Networks** → **Tunnels** → **Create a tunnel** → **Cloudflared** → đặt tên `smart-parking`.
4. Ở bước cài connector, chọn Docker, copy chuỗi token sau `--token` → dán vào `.env.prod`:
   `TUNNEL_TOKEN=eyJ...`
5. Tab **Public Hostname** → Add:
   - Subdomain: `api`, Domain: `<domain của anh>`
   - Service: `HTTP` → `backend:3000`
6. Chạy:

```bash
dcp --profile tunnel up -d
curl https://api.<domain>/api/health
```

### Cách B — không có domain (chỉ demo tạm)

```bash
docker run --rm --network smart-parking_default cloudflare/cloudflared:2025.11.1 \
  tunnel --no-autoupdate --url http://backend:3000
```

Log in ra `https://xxxx.trycloudflare.com`. **URL đổi mỗi lần chạy lại** → phải sửa env Vercel + redeploy mỗi lần.

## 4. Frontend (Vercel)

1. Đẩy code `smart-parking-ui` lên GitHub (đã có `vercel.json` để F5 trang con không bị 404).
2. vercel.com → **Add New → Project** → import `smart-parking-ui`. Framework: **Vite** (tự nhận).
3. **Environment Variables**: `VITE_API_BASE_URL` = `https://api.<domain>/api`
4. Deploy → nhận `https://<tên-project>.vercel.app`.

## 5. Nối frontend ↔ backend

Sửa `.env.prod`:

```env
FRONTEND_URL=https://<tên-project>.vercel.app
CORS_ORIGINS=https://<tên-project>.vercel.app,http://localhost:5173
```

```bash
dcp up -d backend
```

## 6. ESP32

Trong `IOT/smart_parking/smart_parking.ino` đổi `mqtt_server` thành IP LAN của Mac
(xem bằng `ipconfig getifaddr en0`), nạp lại firmware. Nên đặt IP tĩnh cho Mac trên router.

## 7. Giữ Mac luôn chạy

- Docker Desktop: Settings → General → **Start Docker Desktop when you sign in**.
- Không cho ngủ: System Settings → Battery/Energy → *Prevent automatic sleeping when display is off*,
  hoặc `sudo pmset -a sleep 0`. Cắm sạc.
- Container có `restart: unless-stopped` nên tự lên lại khi Docker khởi động.

## Checklist sau khi khởi động lại máy

```bash
dcp ps                                         # 3–4 container Up
pg_isready -h localhost -p 5432                # postgres local
curl http://127.0.0.1:3000/api/health          # backend
curl -s http://127.0.0.1:11434/api/tags        # ollama
curl -s http://127.0.0.1:8000/docs -o /dev/null -w '%{http_code}\n'   # OCR
curl https://api.<domain>/api/health           # tunnel
```
