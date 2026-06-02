# DISCWAKE

## Backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
```

### Env

```bash
export DB_URL=jdbc:postgresql://localhost:5433/appdb
export DB_USER=appuser
export DB_PASSWORD=apppass

export JWT_SECRET=change-me-change-me-change-me-32
export JWT_EXPIRATION_MS=86400000
export JWT_REFRESH_EXPIRATION_MS=1209600000
export JWT_ISSUER=discwake-app

export APP_BASE_URL=http://localhost:5174
export APP_MAIL_FROM=no-reply@disc.local
export AUTH_VERIFY_EXPIRE_MIN=1440
export AUTH_RESET_EXPIRE_MIN=60

export TELEGRAM_ENABLED=false
export TELEGRAM_BOT_TOKEN=
export TELEGRAM_CHAT_ID=

export GOOGLE_OAUTH_CLIENT_ID=google-client-id-1.apps.googleusercontent.com
export GOOGLE_OAUTH_CLIENT_SECRET=google-client-secret
export GOOGLE_OAUTH_CLIENT_IDS=google-client-id-1.apps.googleusercontent.com

# SMTP (enable real email sending)
export MAIL_HOST=smtp.yourprovider.com
export MAIL_PORT=587
export MAIL_USERNAME=your_smtp_username
export MAIL_PASSWORD=your_smtp_password
export MAIL_SMTP_AUTH=true
export MAIL_SMTP_STARTTLS_ENABLE=true

# Nếu không cấu hình MAIL_HOST, hệ thống chỉ log email ra console (không gửi thật).
```

## Chạy bằng Docker Compose (có Postgres)

```bash
docker compose up --build
```

- Postgres: cổng 5433 (user/pass/db mặc định: appuser/apppass/appdb, có thể override bằng biến môi trường).
- Backend: cổng 8083, kết nối DB thông qua `jdbc:postgresql://db:5432/appdb`.
- Frontend: cổng 5174.
- Postgres data lưu trong volume Docker hiện có của script chạy tay hoặc `db_data` (docker-compose), không mất khi dừng container.

### Flyway

Migrations ở `backend/src/main/resources/db/migration` và chạy tự động khi start app.

### API (Public/Auth)

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot
POST /api/auth/reset
GET  /api/auth/verify?token=...
POST /api/auth/verify/resend
GET  /api/auth/me

POST /api/public/consultations
GET  /api/public/guide
POST /api/public/payments/callback
```

Google login body:

```json
{
  "code": "google-authorization-code",
  "redirectUri": "http://localhost:5174/auth/google/callback",
  "referralCode": "ABC12345"
}
```

### API (Partner)

```text
GET  /api/partner/dashboard/summary

POST /api/partner/tests/sessions
GET  /api/partner/tests/sessions
GET  /api/partner/tests/sessions/{sessionId}
GET  /api/partner/tests/sessions/{sessionId}/questions
POST /api/partner/tests/sessions/{sessionId}/answers/autosave
POST /api/partner/tests/sessions/{sessionId}/submit

GET  /api/partner/disc-results
GET  /api/partner/disc-results/{sessionId}

POST /api/partner/exports
GET  /api/partner/exports
GET  /api/partner/exports/{exportId}
POST /api/partner/exports/{exportId}/retry
GET  /api/partner/exports/{exportId}/download

GET  /api/partner/billing/packages
POST /api/partner/billing/orders
GET  /api/partner/billing/orders
POST /api/partner/billing/payments
GET  /api/partner/billing/credit-transactions

GET  /api/partner/affiliate/summary
GET  /api/partner/affiliate/earnings
GET  /api/partner/affiliate/referrals
```

### API (Admin)

```text
GET    /api/admin/catalog/categories
POST   /api/admin/catalog/categories
PUT    /api/admin/catalog/categories/{categoryId}
DELETE /api/admin/catalog/categories/{categoryId}
GET    /api/admin/catalog/categories/validate?testCode=...

GET    /api/admin/catalog/questions
POST   /api/admin/catalog/questions
PUT    /api/admin/catalog/questions/{questionId}
DELETE /api/admin/catalog/questions/{questionId}
GET    /api/admin/catalog/questions/export?testCode=...         (.xlsx)
POST   /api/admin/catalog/questions/import                      (multipart/form-data, field: file)
GET    /api/admin/catalog/questions/export-csv?testCode=...
POST   /api/admin/catalog/questions/import-csv

GET    /api/admin/users
GET    /api/admin/users/{userId}
PUT    /api/admin/users/{userId}/role
PUT    /api/admin/users/{userId}/status
POST   /api/admin/users/{userId}/credits/adjust

GET    /api/admin/finance/orders
PUT    /api/admin/finance/orders/{orderId}/status
PUT    /api/admin/finance/affiliate/percent
GET    /api/admin/finance/overview
```

Import Excel `.xlsx` headers chuẩn:
`id,testCode,categoryId,content,traitKey,reverseScored,weight,orderIndex`

Validate import mạnh hơn:
- bắt buộc đúng header
- kiểm tra tồn tại `testCode`, `categoryId`, `question id` (nếu update)
- kiểm tra định dạng `traitKey`, boolean, số
- reject toàn bộ file nếu có dòng lỗi

### Role

- Partner API yêu cầu `ROLE_PARTNER` hoặc `ROLE_ADMIN`
- Admin API yêu cầu `ROLE_ADMIN`

## Frontend (React + Vite + Tailwind + DaisyUI)

```bash
export VITE_GOOGLE_CLIENT_ID=google-client-id-1.apps.googleusercontent.com
export VITE_GOOGLE_REDIRECT_URI=postmessage
cd discfe
npm install
npm run dev
```

Frontend proxy `/api` về `http://localhost:8083`.
