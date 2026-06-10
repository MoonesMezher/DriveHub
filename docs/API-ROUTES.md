# DriveHub — خريطة APIs الكاملة

> Base: `/api/v1`  
> Stub endpoints ترجع `501` مع رسالة «قيد التطوير»  
> المنفّذة فعلياً: `auth`, `profile`, `location`, `enrollments`, `notifications`, `licenses` (قراءة), `schools` (قراءة), `documents` (رفع)

## Middleware chain القياسي

```
auth → requirePermission → schoolScope* → validators → validate → audit* → controller → service
```

`*` حسب الحاجة

---

## عام

| Method | Path | Auth | ملاحظة |
|--------|------|------|--------|
| GET | `/health` | — | صحة الخادم |
| POST | `/auth/register` | — | |
| POST | `/auth/login` | — | |
| POST | `/auth/refresh` | — | |
| POST | `/auth/logout` | ✓ | |
| GET | `/auth/me` | ✓ | |
| GET | `/auth/contexts` | ✓ | |
| POST | `/auth/switch-context` | ✓ | |
| GET | `/licenses` | — | |
| GET | `/licenses/:code` | — | |
| GET | `/schools/nearby` | اختياري | |
| GET | `/schools/:id` | اختياري | |
| GET | `/reviews/school/:schoolId` | — | |
| POST | `/reviews` | ✓ | |

## مستخدم مسجّل

| Method | Path | Permission |
|--------|------|------------|
| GET/PATCH | `/profile` | `profile:manage` |
| POST/GET | `/location` | ✓ |
| CRUD | `/enrollments` | `enrollment:*` |
| POST | `/enrollments/:id/payment/*` | ✓ |
| GET/PATCH/POST | `/notifications` | ✓ |
| POST/GET | `/documents` | `profile:manage` |
| CRUD | `/pre-registrations` | `enrollment:submit` |
| POST/GET | `/school-applications` | ✓ |

## طالب `/student`

| Method | Path | Permission |
|--------|------|------------|
| GET | `/dashboard` | `student:portal` |
| GET | `/archive` | `student:archive` |
| GET | `/statistics` | `student:portal` |
| GET | `/content/theory` | `student:learn` |
| GET | `/content/theory/:id` | `student:learn` |
| GET | `/content/shared` | `student:learn` |
| GET | `/content/specific` | `student:learn` |
| GET | `/content/videos` | `student:learn` |
| GET/POST | `/content/unlock` | `student:learn` |
| POST | `/practice/start` | `student:practice` |
| POST | `/practice/submit` | `student:practice` |
| GET | `/practice` | `student:practice` |
| GET | `/exam-info` | `student:exam` |
| GET | `/certificates` | `student:certificates` |
| POST/GET | `/lessons` | `student:lessons` |

## مدرب `/coach`

| Method | Path | Permission |
|--------|------|------------|
| GET | `/schedule` | `coach:portal` |
| GET | `/students` | `coach:students` |
| PATCH | `/lessons/:id/complete` | `coach:rate` |
| POST/GET | `/notes` | `coach:rate` |
| POST | `/edits/questions` | `coach:content:edit` |
| POST | `/edits/content` | `coach:content:edit` |

## مدير `/manager`

| Method | Path | Permission |
|--------|------|------------|
| GET/POST | `/courses` | `manager:courses` |
| PATCH | `/courses/:id/close` | `manager:courses` |
| POST | `/courses/:id/launch` | `manager:courses` |
| GET | `/courses/:courseId/enrollments` | `manager:enrollments` |
| POST | `/enrollments/:id/accept` | `manager:enrollments` |
| POST | `/enrollments/:id/reject` | `manager:enrollments` |
| GET/POST/PATCH | `/instructors` | `manager:instructors` |
| POST | `/question-banks` | `manager:questions` |
| POST | `/question-banks/:bankId/questions` | `manager:questions` |
| GET | `/content-edits/pending` | `manager:content:approve` |
| POST | `/content-edits/:id/review` | `manager:content:approve` |
| POST | `/rosters` | `manager:roster` |
| POST | `/rosters/:id/submit` | `manager:roster` |
| POST | `/exam-results` | `manager:enrollments` |

## Admin `/admin`

| Method | Path | Permission |
|--------|------|------------|
| GET/PUT | `/pricing` | `admin:pricing` |
| PATCH | `/commission` | `admin:pricing` |
| GET/PUT | `/licenses/*` | `admin:pricing` |
| GET/POST/PATCH | `/schools` | `admin:schools` |
| GET/POST | `/school-applications` | `admin:schools:approve` |
| GET/POST/PATCH | `/users` | `admin:users` |
| GET/PATCH | `/reviews` | `admin:portal` |
| GET/POST/PATCH | `/ads` | `admin:ads` |
| POST | `/traffic/distribute` | `admin:traffic` |
| GET | `/audit` | `admin:audit` |
| GET | `/reports` | `admin:reports` |

## المرور `/traffic`

| Method | Path | Permission |
|--------|------|------------|
| GET | `/rosters` | `traffic:rosters` |
| GET | `/rosters/:id` | `traffic:rosters` |
| GET/POST/PATCH | `/schedules` | `traffic:schedules` |
| POST/GET | `/results` | `traffic:results` |
| POST | `/licenses` | `traffic:results` |
