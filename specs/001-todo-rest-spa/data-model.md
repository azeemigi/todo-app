# Data Model: TODO REST API & Angular SPA

**Branch**: `001-todo-rest-spa` | **Date**: 2026-06-07

---

## Domain Entity: Todo

The single domain object stored in memory. Not exposed directly over the API —
responses use `TodoResponse`.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `UUID` | Required, server-generated, immutable | Set once at creation via `UUID.randomUUID()` |
| `title` | `String` | Required, 1–200 chars, not blank/whitespace-only | Trimmed before storage |
| `description` | `String` | Optional, max 1000 chars | `null` when absent |
| `completed` | `boolean` | Default `false` | Toggled via PATCH or set via PUT |
| `createdAt` | `Instant` | Server-generated, immutable | Set once at creation |
| `updatedAt` | `Instant` | Server-generated, auto-updated | Set on creation and every mutation |

**State transitions**:
```
incomplete (completed=false)  ⇄  complete (completed=true)
```
Either direction is allowed at any time via `PATCH /api/todos/{id}`.

**Ordering**: The list endpoint returns all TODOs sorted by `createdAt` descending
(newest first).

---

## Request DTOs (Backend)

### CreateTodoRequest

Accepted by `POST /api/todos`. Validated with `@Valid`.

| Field | Type | Validation |
|-------|------|------------|
| `title` | `String` | `@NotBlank`, `@Size(min=1, max=200)` |
| `description` | `String` | `@Size(max=1000)` (nullable/optional) |

```
record CreateTodoRequest(
    @NotBlank @Size(min=1, max=200) String title,
    @Size(max=1000) String description
)
```

### UpdateTodoRequest

Accepted by `PUT /api/todos/{id}`. Full replacement — all fields required.

| Field | Type | Validation |
|-------|------|------------|
| `title` | `String` | `@NotBlank`, `@Size(min=1, max=200)` |
| `description` | `String` | `@Size(max=1000)` (nullable/optional) |
| `completed` | `Boolean` | `@NotNull` |

```
record UpdateTodoRequest(
    @NotBlank @Size(min=1, max=200) String title,
    @Size(max=1000) String description,
    @NotNull Boolean completed
)
```

### PatchTodoRequest

Accepted by `PATCH /api/todos/{id}`. Completion toggle only.

| Field | Type | Validation |
|-------|------|------------|
| `completed` | `Boolean` | `@NotNull` |

```
record PatchTodoRequest(
    @NotNull Boolean completed
)
```

---

## Response DTOs (Backend)

### TodoResponse

Returned by all successful TODO endpoints. Serialised as JSON.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (UUID) | UUID formatted as string |
| `title` | `String` | |
| `description` | `String \| null` | `null` when no description |
| `completed` | `boolean` | |
| `createdAt` | `String` (ISO-8601) | `Instant` serialised as UTC timestamp |
| `updatedAt` | `String` (ISO-8601) | `Instant` serialised as UTC timestamp |

```
record TodoResponse(
    String id,
    String title,
    String description,
    boolean completed,
    String createdAt,
    String updatedAt
)
```

### ErrorResponse / FieldError

Returned on 400, 404, and 500 responses.

```
record FieldError(String field, String message)
record ErrorResponse(List<FieldError> errors)
```

**Example 400**:
```json
{
  "errors": [
    { "field": "title", "message": "must not be blank" },
    { "field": "title", "message": "size must be between 1 and 200" }
  ]
}
```

**Example 404**:
```json
{
  "errors": [
    { "field": "id", "message": "TODO not found" }
  ]
}
```

---

## Frontend Models (TypeScript)

### Todo (interface)

Mirrors the `TodoResponse` JSON shape exactly.

```typescript
interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### CreateTodoDto / UpdateTodoDto / PatchTodoDto

```typescript
interface CreateTodoDto {
  title: string;
  description?: string;
}

interface UpdateTodoDto {
  title: string;
  description?: string;
  completed: boolean;
}

interface PatchTodoDto {
  completed: boolean;
}
```

### ApiError (interface)

Used when parsing error responses from the API.

```typescript
interface FieldError {
  field: string;
  message: string;
}

interface ApiError {
  errors: FieldError[];
}
```

---

## TodoService Signal State (Frontend)

| Signal | Type | Description |
|--------|------|-------------|
| `todos` | `signal<Todo[]>` | Source of truth; newest-first order |
| `loading` | `signal<boolean>` | `true` while any HTTP request is in-flight |
| `error` | `signal<string \| null>` | Last error message; `null` when no error |

All signals are private; the service exposes them as readonly via getter methods or
`computed()` signals for consumption by components.
