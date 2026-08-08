# DriveHub — منصة إدارة مدارس تعليم القيادة

**DriveHub** is a full-stack web platform for managing Syrian driving-school training: license discovery, school enrollment, platform-wallet payments, theory/practice learning, coach scheduling, traffic exam coordination, and admin oversight. The UI is Arabic-first (RTL) with seven role-based portals.

| Service | URL (development) |
|---------|-------------------|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api/v1 |
| Health check | http://localhost:3000/api/v1/health |
| Login | http://localhost:5173/login |

**Full documentation (university template):** [`docs/DriveHub_Documentation.md`](docs/DriveHub_Documentation.md)

---

## 1. Project Overview | نظرة عامة

DriveHub digitizes the end-to-end journey for driving education in Syria:

| Stakeholder | Role | Portal |
|-------------|------|--------|
| Public visitor | `guest` | Public site — licenses, schools map, FAQ, sample content |
| Registered user | `registered` | Student portal — profile, enrollment, notifications |
| Active learner | `student` | Student portal — theory, practice exams, lessons, certificates |
| Instructor | `coach` | School portal — schedule, students, notes, content edit requests |
| School manager | `manager` | School portal — courses, enrollments, coaches, rosters |
| Platform admin | `admin` | Admin portal — pricing, schools, users, wallet credits, reports |
| Traffic authority | `traffic_authority` | Admin portal — rosters, exam schedules, results, license records |

**Key business rules implemented in code:**

- **15-day** training course duration with automatic completion (`completeCourses` cron job).
- **Platform wallet** payments — no external payment gateway; Admin credits balances; students pay from wallet.
- **2%** platform commission on payments (`PLATFORM_COMMISSION`).
- **One pending enrollment** per user; smart waitlist when courses are full.
- **Seat reserved only after payment** confirmation.
- **7 license categories:** B, C, D1, D2, A, H, W (with B1/B2 sub-types).
- **Document encryption** (AES) for identity/medical uploads.
- **QR verification** for statistics, certificates, and rosters (`/verify/*`).

**Not in scope (not implemented):** 3D driving simulator, real payment gateway (PayTabs/Telr), SMS notifications.

---

## 2. Tech Stack | التقنيات

### Monorepo root

| Package | Version | Purpose |
|---------|---------|---------|
| `concurrently` | ^10.0.3 | Run backend + frontend together (`npm run dev`) |

### Backend (`backend/`)

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | **18+** recommended | Runtime |
| Express | ^5.2.1 | REST API |
| MongoDB + Mongoose | ^9.6.3 | Database (~42 models) |
| JWT (`jsonwebtoken`) | ^9.0.3 | Access + refresh tokens |
| `bcryptjs` | ^3.0.2 | Password hashing |
| `express-validator` | ^7.3.2 | Request validation |
| `helmet`, `cors`, `express-rate-limit` | — | Security |
| `multer` | ^1.4.5 | File uploads |
| `nodemailer` + `mailtrap` | — | Email (SMTP / Mailtrap) |
| `node-cron` | ^3.0.3 | Scheduled jobs |
| `qrcode` | ^1.5.4 | QR tokens |
| Jest + Supertest | — | Tests |

### Frontend (`frontend/`)

| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^19.2.0 | UI |
| Vite | ^7.2.4 | Build tool + dev server |
| Tailwind CSS | ^4.3.0 | Styling (Material 3 inspired) |
| TanStack Query | ^5.90.2 | Server state |
| React Router | ^7.16.0 | Routing |
| react-hook-form + Zod | — | Forms & validation |
| Leaflet / Google Maps / Mapbox | — | School maps (`VITE_MAP_PROVIDER`) |
| Vitest + Testing Library | — | Tests |

---

## 3. Prerequisites | المتطلبات

| Tool | Minimum | Verify |
|------|---------|--------|
| **Node.js** | v18+ | `node --version` |
| **npm** | v9+ | `npm --version` |
| **MongoDB** | 6+ (local or Atlas) | `mongosh` or Compass |
| **Git** | optional | `git --version` |

No Docker, Python, or Redis is required for local development.

---

## 4. Installation & Setup | التثبيت والتشغيل

### 4.1 Clone and install

```powershell
git clone <repository-url>
cd "Driving school management system"
```

### 4.2 Backend

```powershell
cd backend
copy .env.example .env
npm install
```

Edit `backend/.env` — at minimum set `MONGODB_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, and admin seed credentials.

### 4.3 Frontend

```powershell
cd ..\frontend
copy .env.example .env
npm install
```

Default `VITE_API_URL=/api/v1` works with the Vite dev proxy (no change needed locally).

### 4.4 Seed database

From `backend/`:

```powershell
npm run seed:licenses
npm run seed:dev
npm run seed:admin
```

> `seed:dev` creates demo schools, users, content, and pricing. `seed:licenses` is optional because `seed:dev` also seeds licenses.

### 4.5 Run (full stack)

From project root:

```powershell
cd ..
npm install
npm run dev
```

Or run separately:

```powershell
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

### 4.6 Tests

```powershell
cd backend && npm test
cd frontend && npm test
```

### 4.7 Production build

```powershell
cd frontend && npm run build
cd backend && npm start
```

---

## 5. Environment Variables | متغيرات البيئة

### Backend (`backend/.env`)

| Variable | Required | Example (dummy) | Description |
|----------|----------|-----------------|-------------|
| `NODE_ENV` | no | `development` | `development` \| `production` \| `test` |
| `PORT` | no | `3000` | API port |
| `MONGODB_URL` | **yes** | `mongodb://127.0.0.1:27017/drivehub` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | **yes** | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` | Access token signing key |
| `JWT_REFRESH_SECRET` | **yes** | `z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4` | Refresh token signing key |
| `JWT_ACCESS_EXPIRES_IN` | no | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | no | `7d` | Refresh token TTL |
| `CORS_ORIGIN` | prod | `https://your-frontend.com` | Allowed frontend origin |
| `ENCRYPTION_KEY` | **yes** | `32-char-minimum-encryption-key!!` | AES key for document encryption |
| `PLATFORM_COMMISSION` | no | `0.02` | Platform fee (2%) |
| `STUDENTS_PER_VEHICLE` | no | `5` | Max students per vehicle for course capacity |
| `MAILTRAP_API_TOKEN` | email | `your-mailtrap-api-token` | Mailtrap API token |
| `MAILTRAP_USE_SANDBOX` | email | `true` | Use Mailtrap sandbox inbox |
| `MAILTRAP_INBOX_ID` | email | `2564102` | Sandbox inbox ID from Mailtrap URL |
| `MAIL_FROM` | email | `sandbox@example.com` | Sender email address |
| `MAIL_FROM_NAME` | email | `DriveHub` | Sender display name |
| `SMTP_HOST` | email | `smtp.gmail.com` | SMTP server (Gmail, Brevo, Mailtrap SMTP) |
| `SMTP_PORT` | email | `587` | SMTP port |
| `SMTP_SECURE` | email | `false` | `true` for port 465 |
| `SMTP_USER` | email | `your@gmail.com` | SMTP username |
| `SMTP_PASS` | email | `abcdefghijklmnop` | SMTP password / app password |
| `SMTP_FROM` | email | `"DriveHub <your@gmail.com>"` | Optional formatted from address |
| `PASSWORD_RESET_CODE_TTL_MINUTES` | no | `10` | OTP validity for forgot-password |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | no | `15` | Reset session TTL |
| `PASSWORD_RESET_MAX_ATTEMPTS` | no | `5` | Max OTP verification attempts |
| `ADMIN_USERNAME` | seed | `Admin` | Admin display name for `seed:admin` |
| `ADMIN_EMAIL` | seed | `admin@drivehub.local` | Admin email for `seed:admin` |
| `ADMIN_PASSWORD` | seed | `AdminPass1!` | Admin password for `seed:admin` |
| `ADMIN_PHONE` | seed | `+963000000000` | Admin phone for `seed:admin` |
| `ADMIN_AGE` | seed | `30` | Admin age for `seed:admin` |

**Email transport priority** (`notificationChannels.js`):

1. `SMTP_HOST` set → nodemailer SMTP (Gmail, **Brevo** `smtp-relay.brevo.com`, Mailtrap SMTP)
2. `MAILTRAP_USE_SANDBOX=true` + token + inbox ID → Mailtrap Sandbox API
3. `MAILTRAP_API_TOKEN` only → Mailtrap Email Sending API
4. None → console log in development

Test SMTP: `node scripts/smtp-test.js` (from `backend/`).

### Frontend (`frontend/.env`)

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | no | `/api/v1` | API base path (proxy in dev) |
| `VITE_MAP_PROVIDER` | no | `leaflet` | `leaflet` \| `google` \| `mapbox` |
| `VITE_GOOGLE_MAPS_KEY` | maps | `AIzaSyDUMMY_KEY_REPLACE_ME` | Google Maps API key |
| `VITE_MAPBOX_TOKEN` | maps | `pk.eyJ1IjoiZHVtbXkifQ.dummy` | Mapbox access token |

> **Never commit `.env` files.** Use `.env.example` as reference only.

---

## 6. API Endpoints | نقاط النهاية

Base URL: **`/api/v1`**

### Response format

```json
{
  "success": true,
  "data": {},
  "message": "optional message",
  "meta": { "pagination": { "page": 1, "total": 0, "limit": 20 } }
}
```

Errors return `success: false` with HTTP 4xx/5xx and a `message` field.

**Authentication:** `Authorization: Bearer <accessToken>` for protected routes.

### 6.1 Health & Auth

| Method | Path | Auth | Body / Notes |
|--------|------|------|--------------|
| GET | `/health` | Public | `{ status, uptime, ... }` |
| POST | `/auth/register` | Public | `{ name, email, password, phone? }` |
| POST | `/auth/login` | Public | `{ email, password, portal?: "student"\|"school"\|"admin" }` → `{ accessToken, refreshToken, user }` |
| POST | `/auth/refresh` | Public | `{ refreshToken }` |
| POST | `/auth/forgot-password` | Public | `{ email }` → generic success always |
| POST | `/auth/verify-reset-code` | Public | `{ email, code }` → `{ resetToken }` |
| POST | `/auth/reset-password` | Public | `{ email, newPassword, resetToken \| code }` |
| POST | `/auth/logout` | Auth | `{ refreshToken? }` |
| GET | `/auth/me` | Auth | Current user + roles |
| GET | `/auth/contexts` | Auth | Available role contexts |
| POST | `/auth/switch-context` | Auth | `{ role, schoolId? }` |

### 6.2 Public content

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/licenses` | Public | License categories list |
| GET | `/licenses/:code` | Public | Category detail (B, C, D1, …) |
| GET | `/schools/nearby` | Optional | `?lat=&lng=&categoryCode=&page=` |
| GET | `/schools/map` | Optional | Map markers |
| GET | `/schools/:id` | Optional | School profile |
| GET | `/schools/:id/courses` | Optional | Open courses |
| GET | `/schools/:id/coaches` | Optional | Coaches list |
| GET | `/faq` | Public | FAQ accordion data |
| GET | `/requirements` | Public | Registration requirements |
| GET | `/testimonials` | Public | Homepage testimonials |
| GET | `/ads` | Public | Active advertisements |
| GET | `/content/sample` | Optional | Free sample content |
| GET | `/settings/privacy` | Public | Privacy settings |
| GET | `/media/:id` | Public | Serve uploaded image |
| GET | `/verify/statistics/:token` | Public | QR statistics verification |
| GET | `/verify/certificate/:token` | Public | QR certificate verification |
| GET | `/verify/roster/:token` | Public | QR roster verification |
| GET | `/reviews/school/:schoolId` | Public | Approved school reviews |
| POST | `/reviews` | Auth | `{ schoolId, rating, comment }` |

### 6.3 Registered user

| Method | Path | Permission | Body / Notes |
|--------|------|------------|--------------|
| GET/PATCH | `/profile` | `profile:manage` | Profile read/update |
| POST/GET | `/location` | Auth | Save/get GPS location |
| GET | `/enrollments` | `enrollment:submit` | My enrollments |
| POST | `/enrollments` | `enrollment:submit` | `{ courseId, schoolId, categoryCode, subTypeCode?, prefersFemaleCoach? }` |
| POST | `/enrollments/retake` | `enrollment:submit` | `{ priorEnrollmentId, retakeScope? }` |
| GET | `/enrollments/:id` | Auth | Enrollment detail |
| DELETE | `/enrollments/:id` | `enrollment:cancel` | Cancel pending |
| POST | `/enrollments/:id/pay-from-wallet` | Auth | Pay from platform wallet |
| POST | `/enrollments/:id/payment/initiate` | Auth | Initiate payment record |
| POST | `/enrollments/:id/payment/claim` | Auth | Claim offline payment |
| POST | `/enrollments/:id/payment/retake/*` | Auth | Retake payment variants |
| GET/PATCH | `/notifications` | Auth | List / mark read |
| GET | `/search` | Auth | Global search |
| POST/GET | `/documents` | `profile:manage` | Upload/list encrypted documents |
| GET | `/documents/:id/download` | Auth | Download document |
| GET/POST/DELETE | `/pre-registrations` | `enrollment:submit` | Pre-registration when no open course |
| POST/GET | `/school-applications` | `profile:manage` | Request to add a school |

### 6.4 Student portal (`/student/*`)

Requires `student:portal` + sub-permissions.

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/student/dashboard` | portal | Dashboard KPIs |
| GET | `/student/archive` | `student:archive` | Past enrollments |
| GET | `/student/statistics` | portal | Progress statistics |
| GET | `/student/content/theory` | `student:learn` | Theory articles (paginated) |
| GET | `/student/content/theory/:id` | `student:learn` | Single article |
| POST | `/student/content/theory/:id/complete` | `student:learn` | Mark complete |
| GET | `/student/content/shared` | `student:learn` | Shared content |
| GET | `/student/content/specific` | `student:learn` | School-specific content |
| GET | `/student/content/videos` | `student:learn` | Video lessons |
| GET/POST | `/student/content/unlock` | `student:learn` | Gradual/full unlock mode |
| POST | `/student/practice/start` | `student:practice` | Start timed practice exam |
| POST | `/student/practice/submit` | `student:practice` | Submit answers |
| GET | `/student/practice` | `student:practice` | Practice history |
| GET | `/student/exam-info` | `student:exam` | Traffic exam schedule |
| GET | `/student/certificates` | `student:certificates` | Certificates |
| POST | `/student/lessons` | `student:lessons` | Book practical lesson |
| POST | `/student/lessons/auto-book` | `student:lessons` | Auto-book first slot |
| GET | `/student/lessons/eligible-coaches` | `student:lessons` | Coaches for booking |
| GET | `/student/lessons` | `student:lessons` | My lessons |

### 6.5 Coach portal (`/coach/*`)

Requires `coach:portal` + `schoolScope`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/coach/schedule` | Daily schedule |
| GET | `/coach/students` | Assigned students |
| PATCH | `/coach/lessons/:id/complete` | Complete/rate lesson |
| POST/GET | `/coach/notes` | Student notes |
| GET | `/coach/question-banks` | Question banks |
| GET | `/coach/content` | Training content |
| POST | `/coach/edits/questions` | Request question edit |
| POST | `/coach/edits/content` | Request content edit |

### 6.6 Manager portal (`/manager/*`)

Requires `manager:portal` + `schoolScope`.

| Group | Key endpoints |
|-------|---------------|
| Courses | `GET/POST /manager/courses`, `PATCH .../close`, `POST .../launch` |
| Enrollments | `GET .../enrollments`, `POST .../accept`, `POST .../reject`, `POST .../payment/confirm` |
| Instructors | `GET/POST/PATCH /manager/instructors` |
| Question banks | `GET/POST /manager/question-banks`, `POST .../questions` |
| Content | `GET/POST /manager/content/theory`, `GET/POST /manager/content-edits/*` |
| Rosters | `GET/POST /manager/rosters`, `POST .../submit` |
| Schedule | `GET /manager/schedule` |

### 6.7 Admin portal (`/admin/*`)

Requires `admin:portal` + sub-permissions.

| Group | Key endpoints |
|-------|---------------|
| Pricing | `GET/PUT /admin/pricing`, `PATCH /admin/commission` |
| Licenses | `GET /admin/licenses`, `PUT /admin/licenses/categories`, `PUT .../sub-types` |
| FAQ / Requirements / Testimonials | Full CRUD under `/admin/faq`, `/admin/requirements`, `/admin/testimonials` |
| Schools | `GET/POST/PATCH/DELETE /admin/schools` |
| Compliance | `GET/POST /admin/compliance`, approve/reject |
| Users & wallet | `GET /admin/users`, `POST .../roles`, `PATCH .../status`, `GET/POST .../wallet/credit` |
| Settings | `GET/PUT /admin/settings/privacy`, `GET/PUT .../registration` |
| Reviews | `GET /admin/reviews/pending`, `PATCH .../moderate` |
| Ads | `GET/POST/PATCH /admin/ads` |
| Traffic | `POST /admin/traffic/distribute` |
| Audit & reports | `GET /admin/audit`, `GET /admin/reports` |
| Payments | `POST /admin/enrollments/:id/payment/confirm` |

### 6.8 Traffic portal (`/traffic/*`)

Requires `traffic:portal`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/traffic/dashboard` | Dashboard |
| GET | `/traffic/rosters` | Distributed rosters |
| GET/POST/PATCH | `/traffic/schedules` | Exam scheduling |
| GET/POST | `/traffic/results` | Enter exam results |
| POST | `/traffic/results/bulk` | Bulk import results |
| POST | `/traffic/licenses` | Issue driving license record |

**Complete reference:** [`docs/DriveHub_Documentation.md`](docs/DriveHub_Documentation.md) §3.3, Postman collection (`backend/postman/`), or import `DriveHub_API.postman_collection.json` (162+ requests).

---

## 7. Folder Structure | هيكل المجلدات

```
Driving school management system/
├── package.json              # npm run dev (concurrently)
├── README.md                 # This file
├── LOGIN.md                  # Demo account credentials
├── NOTES.md                  # Implementation status vs project plan
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── postman/              # Postman collection + environment
│   ├── scripts/              # smtp-test.js
│   ├── tests/                # Jest unit + integration + performance
│   └── src/
│       ├── server.js         # Entry: DB connect + cron + listen
│       ├── app.js            # Express middleware stack
│       ├── config/           # env config, database, cors
│       ├── routes/v1/        # HTTP routes (28 files)
│       ├── controllers/      # Request/response handlers
│       ├── services/         # Business logic (~22 services)
│       ├── models/           # Mongoose schemas (~42 models)
│       ├── validators/       # express-validator rules
│       ├── policies/         # authorize.js — RBAC permissions
│       ├── middlewares/      # auth, upload, rate limit, audit
│       ├── jobs/             # Cron: payments, reminders, course completion
│       ├── helpers/          # Domain helpers
│       ├── constants/        # roles, permissions, statuses
│       ├── utils/            # ApiError, logger, date utils
│       └── scripts/          # seed: admin, dev, licenses, content
├── frontend/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js        # Dev proxy /api → :3000
│   ├── public/images/        # Static driving-school assets
│   └── src/
│       ├── app/              # router, layouts, guards, providers
│       ├── features/         # Pages by domain (student, admin, …)
│       ├── components/       # ui/, layout/, sections/, auth/
│       ├── lib/              # api, services, auth, design tokens
│       ├── hooks/
│       └── styles/           # theme.css (RTL, design tokens)
└── docs/
    ├── DriveHub_Documentation.md   # Full bilingual documentation
    ├── API.md / API-ROUTES.md      # Legacy API notes
    ├── generate_documentation_docx.py
    └── postman/ README in backend/postman/
```

---

## 8. Deployment | النشر

There is **no Dockerfile or CI/CD** in the repository yet. Recommended production layout:

```
[Browser] → [Static host: Vercel/Netlify/S3+CloudFront]
                ↓ VITE_API_URL=https://api.yourdomain.com/api/v1
            [Node.js host: Railway/Render/AWS EC2/Elastic Beanstalk]
                ↓ MONGODB_URL
            [MongoDB Atlas]
```

### 8.1 MongoDB Atlas

1. Create a free/paid cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Allow your server IP (or `0.0.0.0/0` for testing only).
3. Set `MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/drivehub`.

### 8.2 Backend (Railway / Render / AWS EC2)

```bash
cd backend
npm ci --omit=dev
# Set all production env vars (secrets, CORS_ORIGIN, SMTP, ENCRYPTION_KEY)
npm start
```

Production checklist:

- `NODE_ENV=production`
- Strong `JWT_*_SECRET` and `ENCRYPTION_KEY`
- `CORS_ORIGIN=https://your-frontend-domain.com`
- Configure SMTP (Gmail app password, Brevo SMTP relay, or Mailtrap Sending with verified domain)
- HTTPS termination at reverse proxy (app enables HSTS via Helmet in production)

### 8.3 Frontend — Vercel

1. Import Git repo; set **Root Directory** to `frontend`.
2. Build: `npm run build` — Output: `dist`.
3. Environment: `VITE_API_URL=https://api.yourdomain.com/api/v1`.
4. Deploy. Enable SPA fallback (`vercel.json` rewrite to `index.html` if needed).

### 8.4 Frontend — Netlify

1. Base directory: `frontend`.
2. Build command: `npm run build` — Publish: `dist`.
3. Add `_redirects`: `/* /index.html 200` for client-side routing.
4. Set `VITE_API_URL` to your API URL.

### 8.5 AWS (basic)

| Component | Service |
|-----------|---------|
| Frontend static files | S3 + CloudFront |
| API | EC2 (Node 18+) or Elastic Beanstalk |
| Database | MongoDB Atlas (recommended) or DocumentDB |
| Secrets | AWS Systems Manager Parameter Store |
| HTTPS | ACM certificate on ALB/CloudFront |

### 8.6 Scheduled jobs

Cron jobs run inside the Node process (`backend/src/jobs/scheduler.js`):

- **Hourly:** expire awaiting-payment enrollments + waitlist promotion
- **Daily 08:00:** exam reminders, payment deadline reminders, auto-complete courses

Ensure **only one** backend instance runs crons, or extract jobs to a separate worker later.

---

## Demo Accounts | حسابات تجريبية

Run seeds first: `npm run seed:dev` then `npm run seed:admin` in `backend/`.

| Role | Portal | Email | Password |
|------|--------|-------|----------|
| Registered | دخول الطلاب | `student@drivehub.local` | `StudentPass1!` |
| Student | دخول الطلاب | `activestudent@drivehub.local` | `StudentPass1!` |
| Coach | المدارس/المدربين | `coach@drivehub.local` | `StudentPass1!` |
| Manager | المدارس/المدربين | `manager@drivehub.local` | `StudentPass1!` |
| Admin | الإدارة | `admin@drivehub.local` | `AdminPass1!` |
| Traffic | الإدارة | `traffic@drivehub.local` | `StudentPass1!` |

**Guest (زائر):** browse public pages without login.

---

## License

ISC (per `package.json` files).
