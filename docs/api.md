# API Endpoints

This document describes the HTTP API under `/api`.

## Base URL

Use the same host as the Next.js app, for example: `https://your-host.com/api`.

## Authentication

Most endpoints require a valid Supabase access token.

Provide it via:

- `Authorization: Bearer <access_token>`

Auth endpoints:

- `POST /api/auth/login` returns tokens and sets `sb_access_token` and `sb_refresh_token` cookies.
- `POST /api/auth/logout` clears those cookies.

## Response Shapes

Successful responses are JSON unless otherwise stated. Errors follow a consistent shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

The `details` field is optional.

## Endpoints

### Auth

#### `POST /api/auth/signup`

Creates a Supabase Auth user and a `Profile` row (PENDING by default).

Body:

```json
{
  "email": "user@example.com",
  "password": "password",
  "userIdNum": "ID-123",
  "licenseNum": "LIC-123",
  "firstName": "Jane",
  "middleName": "Q",
  "lastName": "Public"
}
```

Response: `201 Created`

```json
{
  "ok": true,
  "message": "Signed up. Please log in (and wait for approval if required).",
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "userIdNum": "ID-123",
    "licenseNum": "LIC-123",
    "firstName": "Jane",
    "middleName": "Q",
    "lastName": "Public",
    "role": "USER",
    "status": "PENDING",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Notes:

- `email`, `userIdNum`, and `licenseNum` must be unique.

#### `POST /api/auth/login`

Logs in using `userIdNum` and `password`.

Body:

```json
{
  "userIdNum": "ID-123",
  "password": "password"
}
```

Response: `200 OK`

```json
{
  "access_token": "jwt",
  "refresh_token": "jwt",
  "token_type": "bearer",
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "userIdNum": "ID-123",
    "licenseNum": "LIC-123",
    "firstName": "Jane",
    "middleName": "Q",
    "lastName": "Public",
    "role": "USER",
    "status": "APPROVED",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Notes:

- Sets `sb_access_token` and `sb_refresh_token` cookies (HttpOnly).
- API requests auto-refresh expired access tokens using `sb_refresh_token`.

#### `POST /api/auth/logout`

Revokes the Supabase session (if present) and clears auth cookies.

Response: `200 OK`

```json
{ "success": true }
```

#### `POST /api/auth/ensure-profile`

Ensures the authenticated user has a `Profile` row. Allowlisted emails can be promoted to `ADMIN` and `APPROVED`.

Headers:

- `Authorization: Bearer <access_token>`

Response: `200 OK`

```json
{
  "profile": {
    "id": "uuid",
    "role": "USER",
    "status": "APPROVED",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### Me

#### `GET /api/me`

Returns the authenticated user and their profile.

Headers:

- `Authorization: Bearer <access_token>`

Response: `200 OK`

```json
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "userIdNum": "ID-123",
    "licenseNum": "LIC-123",
    "firstName": "Jane",
    "middleName": "Q",
    "lastName": "Public",
    "role": "USER",
    "status": "APPROVED",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### AuthZ

#### `GET /api/authz/check`

Internal helper to validate token and profile status.

Headers:

- `Authorization: Bearer <access_token>`

Query params:

- `adminOnly=1` (optional) - requires `ADMIN` + `APPROVED`

Response: `200 OK`

```json
{
  "ok": true,
  "user": { "id": "uuid", "email": "user@example.com" },
  "profile": { "id": "uuid", "role": "ADMIN", "status": "APPROVED" }
}
```

### Admin

All admin endpoints require an approved admin profile.

Headers:

- `Authorization: Bearer <access_token>`

#### `GET /api/admin/pending`

Lists pending profiles.

Response: `200 OK`

```json
{
  "pending": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "userIdNum": "ID-123",
      "licenseNum": "LIC-123",
      "firstName": "Jane",
      "middleName": "Q",
      "lastName": "Public",
      "role": "USER",
      "status": "PENDING",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/admin/users/:id/approve`

Approves a user profile.

Params:

- `id`: Profile id (Supabase user id)

Response: `200 OK`

```json
{
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "userIdNum": "ID-123",
    "licenseNum": "LIC-123",
    "firstName": "Jane",
    "middleName": "Q",
    "lastName": "Public",
    "role": "USER",
    "status": "APPROVED",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

#### `POST /api/admin/users/:id/reject`

Rejects a user profile.

Params:

- `id`: Profile id (Supabase user id)

Response: `200 OK`

```json
{
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "userIdNum": "ID-123",
    "licenseNum": "LIC-123",
    "firstName": "Jane",
    "middleName": "Q",
    "lastName": "Public",
    "role": "USER",
    "status": "REJECTED",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

### Patients

All patient endpoints require an approved profile.

Headers:

- `Authorization: Bearer <access_token>`

#### `POST /api/patients`

Creates a new patient session and ensures `LabForm` rows for requested forms.

Body:

```json
{
  "patientIdNum": "P-0001",
  "lastName": "Doe",
  "firstName": "John",
  "middleName": null,
  "dateOfBirth": "1990-01-01T00:00:00.000Z",
  "age": 35,
  "sex": "MALE",
  "status": "PENDING",
  "requestingPhysician": "Dr. Smith",
  "requestedForms": ["CBC"]
}
```

Response: `201 Created`

```json
{
  "ok": true,
  "message": "Patient created successfully",
  "patient": {
    "id": "uuid",
    "patientIdNum": "P-0001",
    "lastName": "Doe",
    "firstName": "John",
    "middleName": null,
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "age": 35,
    "sex": "MALE",
    "status": "PENDING",
    "requestingPhysician": "Dr. Smith",
    "requestedForms": ["CBC"],
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

#### `GET /api/patients`

Lists patient sessions.

Query params:

- `q` (optional) - search by patient ID or name
- `limit` (optional, default 20, max 100)
- `cursor` (optional) - for pagination

Response: `200 OK`

```json
{
  "ok": true,
  "message": "Patients listed successfully",
  "patients": []
}
```

#### `GET /api/patients/:id`

Fetches a patient session by id.

Response: `200 OK`

```json
{
  "ok": true,
  "message": "Patient fetched successfully",
  "patient": {}
}
```

#### `PATCH /api/patients/:id`

Updates patient session fields and optionally ensures `LabForm` rows.

Body (all optional):

```json
{
  "patientIdNum": "P-0001",
  "lastName": "Doe",
  "firstName": "John",
  "middleName": null,
  "dateOfBirth": "1990-01-01T00:00:00.000Z",
  "age": 35,
  "sex": "MALE",
  "status": "COMPLETED",
  "requestingPhysician": "Dr. Smith",
  "requestedForms": ["CBC"]
}
```

Response: `200 OK`

```json
{
  "ok": true,
  "message": "Patient updated successfully",
  "patient": {}
}
```

### Forms

All form endpoints require an approved profile.

Headers:

- `Authorization: Bearer <access_token>`

#### `GET /api/patients/:id/forms`

Lists all `LabForm` entries for a patient session.

Response: `200 OK`

```json
{
  "ok": true,
  "message": "Forms fetched successfully",
  "forms": []
}
```

#### `POST /api/patients/:id/forms`

Creates or updates a `LabForm` for a patient session.

Body:

```json
{
  "formType": "CBC",
  "data": {}
}
```

Response: `200 OK`

```json
{
  "ok": true,
  "message": "Form saved successfully",
  "form": {}
}
```

#### `GET /api/patients/:id/forms/:formType`

Fetches a single form by patient session and form type.

Response: `200 OK`

```json
{
  "ok": true,
  "message": "Form fetched successfully",
  "form": {}
}
```

#### `PATCH /api/patients/:id/forms/:formType`

Updates a `LabForm`. Requires a valid edit lock.

Body:

```json
{
  "lockToken": "uuid",
  "data": {},
  "expectedVersion": 1
}
```

Response: `200 OK`

```json
{
  "ok": true,
  "message": "Form updated successfully",
  "form": {}
}
```

Notes:

- If `expectedVersion` is provided and does not match, the API returns `409 VERSION_CONFLICT`.

### Form Locks

Locks prevent simultaneous edits to the same form until explicitly released by the lock holder.

#### `POST /api/patients/:id/forms/:formType/lock`

Acquires or refreshes an edit lock.

Body (optional):

```json
{
  "lockToken": "uuid"
}
```

Response: `200 OK`

```json
{
  "ok": true,
  "message": "Lock acquired successfully",
  "lockToken": "uuid"
}
```

Notes:

- Returns `409 LOCK_CONFLICT` when locked by another user.

#### `DELETE /api/patients/:id/forms/:formType/lock`

Releases a lock held by the caller.

Body:

```json
{
  "lockToken": "uuid"
}
```

Response: `204 No Content`

#### `POST /api/patients/:id/forms/:formType/lock/renew`

Renews a lock held by the caller.

Body:

```json
{
  "lockToken": "uuid"
}
```

Response: `200 OK`

```json
{
  "ok": true,
  "message": "Lock renewed successfully",
  "lockToken": "uuid"
}
```

## Example Requests

### Login

```bash
curl -X POST https://your-host.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userIdNum":"ID-123","password":"password"}'
```

### List patients

```bash
curl https://your-host.com/api/patients \
  -H "Authorization: Bearer <access_token>"
```
