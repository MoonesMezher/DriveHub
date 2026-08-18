# DriveHub — Login (Demo Accounts)

**URL:** [http://localhost:5173/login](http://localhost:5173/login)

## Seed (once, or to refresh demo data)

From `backend/` (requires MongoDB + `ADMIN_*` in `.env`):

```powershell
npm run seed:all
```

Equivalent stepwise:

```powershell
npm run seed:admin
npm run seed:dev
```

Optional alone: `npm run seed:licenses` · `npm run seed:content`  
(`seed:dev` / `seed:all` already include licenses + content.)

Passwords below match the seed scripts. Admin password comes from `ADMIN_PASSWORD` (default `AdminPass1!`).

---

## Registered (مسجّل)


|              |                          |
| ------------ | ------------------------ |
| **Portal**   | دخول الطلاب              |
| **Email**    | `student@drivehub.local` |
| **Password** | `StudentPass1!`          |
| **Notes**    | Wallet pre-credited for enrollment demo |


---

## Student (طالب)


|              |                                |
| ------------ | ------------------------------ |
| **Portal**   | دخول الطلاب                    |
| **Email**    | `activestudent@drivehub.local` |
| **Password** | `StudentPass1!`                |
| **Notes**    | Active B1 enrollment @ مدرسة النور; prefers female coach |


---

## Coach (مدرب)


|              |                         |
| ------------ | ----------------------- |
| **Portal**   | المدارس/المدربين        |
| **Email**    | `coach@drivehub.local`  |
| **Password** | `StudentPass1!`         |
| **Notes**    | Male instructor (B)     |


### Female coach (مدربة)

|              |                          |
| ------------ | ------------------------ |
| **Portal**   | المدارس/المدربين         |
| **Email**    | `coach2@drivehub.local`  |
| **Password** | `StudentPass1!`          |
| **Notes**    | Female instructor (B)    |


---

## Manager (مدير مدرسة)


|              |                          |
| ------------ | ------------------------ |
| **Portal**   | المدارس/المدربين         |
| **Email**    | `manager@drivehub.local` |
| **Password** | `StudentPass1!`          |
| **Notes**    | Manager @ مدرسة النور (`managerId` linked); `manager2@…` @ أكاديمية الأمان |


---

## Admin


|              |                        |
| ------------ | ---------------------- |
| **Portal**   | الإدارة                |
| **Email**    | `admin@drivehub.local` |
| **Password** | `AdminPass1!`          |


---

## Traffic (المرور)


|              |                          |
| ------------ | ------------------------ |
| **Portal**   | الإدارة                  |
| **Email**    | `traffic@drivehub.local` |
| **Password** | `StudentPass1!`          |


---

> **Guest (زائر)** — no login. Browse the public site only.
>
> **Login lockout:** none — `/auth/login` is not rate-limited and has no failed-attempt lock.
