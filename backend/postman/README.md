# DriveHub Postman Collection

## Files

| File | Description |
|------|-------------|
| `DriveHub_API.postman_collection.json` | Full API collection (162+ requests) |
| `DriveHub_Local.postman_environment.json` | Local dev environment variables |
| `generateCollection.js` | Regenerate collection after API changes |

## Import into Postman

1. Open Postman → **Import**
2. Select both JSON files in this folder
3. Choose environment **DriveHub Local** from the top-right dropdown

## Prerequisites

```bash
cd backend
npm install
npm run seed:licenses
npm run seed:dev
npm run seed:admin
npm run dev
```

## Quick Start

1. Run folder **01 - Setup & Auth Tokens** (Collection Runner or one-by-one)
   - Logs in all roles and saves tokens
   - Resolves `schoolId`, `courseId`, etc.
2. Use role folders (05–09) with pre-configured bearer tokens
3. Run **10 - End-to-End Workflows** for full enrollment flow

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@drivehub.local` | `AdminPass1!` |
| Manager | `manager@drivehub.local` | `StudentPass1!` |
| Active Student | `activestudent@drivehub.local` | `StudentPass1!` |
| Student | `student@drivehub.local` | `StudentPass1!` |
| Coach | `coach@drivehub.local` | `StudentPass1!` |
| Traffic | `traffic@drivehub.local` | `StudentPass1!` |

## Collection Structure

```
01 - Setup & Auth Tokens
02 - Public
03 - Auth
04 - User (Authenticated)
05 - Student Portal
06 - Coach Portal
07 - Manager Portal
08 - Admin Portal
09 - Traffic Portal
10 - End-to-End Workflows
11 - Error States
```

## Regenerate

```bash
node backend/postman/generateCollection.js
```

## Tests

Each request includes tests for:
- HTTP 2xx status
- `success: true` in response body
- Auto-save of tokens and IDs to collection variables

Error state folder tests 401, 403, 404, 422 responses.
