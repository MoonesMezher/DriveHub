# DriveHub API — المرحلة 1

القاعدة: `http://localhost:3000/api/v1`  
التوثيق: `Authorization: Bearer <accessToken>`

## شكل الاستجابة

### نجاح
```json
{
  "success": true,
  "data": { },
  "message": "رسالة اختيارية",
  "meta": { "pagination": { "page": 1, "limit": 20, "total": 0, "totalPages": 1 } }
}
```

### خطأ تحقق (400)
```json
{
  "success": false,
  "message": "خط العرض (lat) مطلوب",
  "errors": [{ "field": "lat", "message": "...", "value": "", "location": "query" }]
}
```

### خطأ API (4xx/5xx)
```json
{
  "success": false,
  "message": "رسالة عربية واضحة",
  "requestId": "uuid"
}
```

---

## Health

| Method | Path | Auth | الوصف |
|--------|------|------|--------|
| GET | `/health` | لا | فحص صحة الخادم |

---

## Auth

| Method | Path | Auth | الوصف |
|--------|------|------|--------|
| POST | `/auth/register` | لا | تسجيل مستخدم جديد |
| POST | `/auth/login` | لا | تسجيل الدخول |
| POST | `/auth/refresh` | لا | تحديث access token |
| POST | `/auth/logout` | نعم | تسجيل الخروج |
| GET | `/auth/me` | نعم | بيانات الجلسة الحالية |
| GET | `/auth/contexts` | نعم | السياقات المتاحة |
| POST | `/auth/switch-context` | نعم | تبديل الدور/المدرسة |

### POST `/auth/register`
```json
{
  "name": "أحمد محمد",
  "email": "user@example.com",
  "phone": "0944123456",
  "password": "SecurePass1!"
}
```

### POST `/auth/login`
```json
{
  "email": "user@example.com",
  "password": "SecurePass1!",
  "portal": "student"
}
```
`portal`: `student` | `school` | `admin`

---

## Profile

| Method | Path | Auth | الصلاحية |
|--------|------|------|----------|
| GET | `/profile` | نعم | `profile:manage` |
| PATCH | `/profile` | نعم | `profile:manage` |

### PATCH `/profile`
```json
{
  "name": "أحمد محمد",
  "phone": "0944123456",
  "profileData": { "governorate": "دمشق" }
}
```

---

## Location

| Method | Path | Auth | الوصف |
|--------|------|------|--------|
| POST | `/location` | نعم | حفظ موقع المستخدم |
| GET | `/location` | نعم | آخر موقع محفوظ |

### POST `/location`
```json
{
  "lat": 33.5138,
  "lng": 36.2765,
  "source": "gps",
  "governorate": "دمشق"
}
```

---

## Licenses

| Method | Path | Auth | الوصف |
|--------|------|------|--------|
| GET | `/licenses` | لا | قائمة فئات الرخص |
| GET | `/licenses/:code` | لا | تفاصيل فئة (مثل `B`) |

---

## Schools

| Method | Path | Auth | الوصف |
|--------|------|------|--------|
| GET | `/schools/nearby` | اختياري | أقرب المدارس |
| GET | `/schools/:id` | اختياري | تفاصيل مدرسة |

### GET `/schools/nearby`
Query: `lat`, `lng` (مطلوبان), `category`, `femaleCoach`, `page`, `limit`

مثال: `/schools/nearby?lat=33.51&lng=36.27&category=B&femaleCoach=true`

---

## Enrollments

| Method | Path | Auth | الصلاحية |
|--------|------|------|----------|
| GET | `/enrollments` | نعم | `enrollment:submit` |
| POST | `/enrollments` | نعم | `enrollment:submit` |
| GET | `/enrollments/:id` | نعم | — |
| DELETE | `/enrollments/:id` | نعم | `enrollment:cancel` |
| POST | `/enrollments/:id/payment/initiate` | نعم | — |
| POST | `/enrollments/:id/payment/confirm` | نعم | — |

### POST `/enrollments`
```json
{
  "courseId": "mongoId",
  "schoolId": "mongoId",
  "categoryCode": "B",
  "subTypeCode": "B1",
  "prefersFemaleCoach": false
}
```

### POST `/enrollments/:id/payment/confirm`
```json
{
  "amount": 500000,
  "gatewayRef": "PAY-12345"
}
```

### حالات الطلب
`submitted` → `awaiting_payment` → `paid` | `expired` | `cancelled` | `rejected`

---

## Notifications

| Method | Path | Auth | الوصف |
|--------|------|------|--------|
| GET | `/notifications` | نعم | قائمة الإشعارات |
| PATCH | `/notifications/:id/read` | نعم | تعليم كمقروء |
| POST | `/notifications/read-all` | نعم | تعليم الكل كمقروء |

Query: `page`, `limit`, `unreadOnly=true`

---

## بيانات التطوير

```bash
npm run seed:licenses
npm run seed:dev
npm run seed:admin
```

| الحساب | البريد | كلمة المرور |
|--------|--------|-------------|
| Admin | من `.env` | من `.env` |
| طالب تجريبي | `student@drivehub.local` | `StudentPass1!` |

---

## أكواد الأخطاء الشائعة

| HTTP | الرسالة |
|------|---------|
| 400 | بيانات غير صالحة / مهلة الدفع منتهية |
| 401 | غير مصرّح — يرجى تسجيل الدخول |
| 403 | ليس لديك صلاحية / الحساب موقوف |
| 404 | المورد غير موجود |
| 409 | طلب معلّق موجود / بريد مكرر |
