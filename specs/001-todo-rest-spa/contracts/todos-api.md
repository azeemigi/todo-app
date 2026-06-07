# API Contract: /api/todos

**Base URL**: `http://localhost:8080/api/todos`
**Content-Type**: `application/json` (all requests and responses)
**Date**: 2026-06-07

All request bodies must be valid JSON. All responses return JSON. Timestamps are
ISO-8601 strings in UTC (e.g., `"2026-06-07T10:30:00Z"`).

---

## GET /api/todos

Returns all TODOs, ordered newest-first (by `createdAt` descending).

**Request**: No body, no query parameters.

**Response 200 OK**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "createdAt": "2026-06-07T10:30:00Z",
    "updatedAt": "2026-06-07T10:30:00Z"
  }
]
```

Returns an empty array `[]` when no TODOs exist.

---

## GET /api/todos/{id}

Returns a single TODO by its UUID.

**Path parameter**: `id` — UUID string (e.g., `550e8400-e29b-41d4-a716-446655440000`)

**Response 200 OK**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "createdAt": "2026-06-07T10:30:00Z",
  "updatedAt": "2026-06-07T10:30:00Z"
}
```

**Response 404 Not Found**:
```json
{
  "errors": [
    { "field": "id", "message": "TODO not found" }
  ]
}
```

---

## POST /api/todos

Creates a new TODO. `id`, `createdAt`, and `updatedAt` are server-generated.

**Request body**:
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `title` | Yes | 1–200 characters; not blank/whitespace-only |
| `description` | No | Max 1000 characters; omit or send `null` if absent |

**Response 201 Created**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "createdAt": "2026-06-07T10:30:00Z",
  "updatedAt": "2026-06-07T10:30:00Z"
}
```

**Response 400 Bad Request** (validation failure):
```json
{
  "errors": [
    { "field": "title", "message": "must not be blank" }
  ]
}
```

---

## PUT /api/todos/{id}

Replaces an existing TODO. All writable fields must be supplied.

**Path parameter**: `id` — UUID string

**Request body**:
```json
{
  "title": "Buy groceries and cook dinner",
  "description": null,
  "completed": false
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `title` | Yes | 1–200 characters; not blank/whitespace-only |
| `description` | No | Max 1000 characters; send `null` to clear |
| `completed` | Yes | Boolean (`true` or `false`) |

**Response 200 OK** — returns the updated TODO (same shape as GET).

**Response 400 Bad Request** — same error shape as POST.

**Response 404 Not Found** — same error shape as GET /{id}.

---

## PATCH /api/todos/{id}

Toggles the completion state of an existing TODO. Only `completed` may be sent.

**Path parameter**: `id` — UUID string

**Request body**:
```json
{
  "completed": true
}
```

| Field | Required | Constraints |
|-------|----------|-------------|
| `completed` | Yes | Boolean (`true` or `false`) |

**Response 200 OK** — returns the updated TODO (same shape as GET).

**Response 400 Bad Request**:
```json
{
  "errors": [
    { "field": "completed", "message": "must not be null" }
  ]
}
```

**Response 404 Not Found** — same error shape as GET /{id}.

---

## DELETE /api/todos/{id}

Permanently deletes a TODO.

**Path parameter**: `id` — UUID string

**Response 204 No Content** — empty body; deletion successful.

**Response 404 Not Found** — same error shape as GET /{id}.

---

## Error Response Shape (all endpoints)

All non-2xx responses use this JSON structure:

```json
{
  "errors": [
    { "field": "<field-name>", "message": "<human-readable reason>" }
  ]
}
```

For resource-not-found errors, `field` is `"id"`.
For server errors (5xx), `field` is `"server"` and the message is generic (no stack
trace exposed).

---

## HTTP Status Code Summary

| Status | When |
|--------|------|
| 200 OK | Successful GET, PUT, PATCH |
| 201 Created | Successful POST |
| 204 No Content | Successful DELETE |
| 400 Bad Request | Validation failure |
| 404 Not Found | Resource does not exist |
| 500 Internal Server Error | Unexpected server error |
