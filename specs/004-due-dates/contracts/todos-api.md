# API Contract: Todos (Updated for Due Dates)

**Feature**: `004-due-dates` | **Date**: 2026-06-08  
**Base URL**: `/api/todos`

Changes from the previous contract are marked **NEW** or **UPDATED**.

---

## GET /api/todos

List todos with optional filtering and sorting.

### Query Parameters

| Parameter | Type | Default | Values | Notes |
|-----------|------|---------|--------|-------|
| `status` | string | `all` | `all` \| `active` \| `completed` | Existing |
| `q` | string | — | any | Full-text search on title and description; existing |
| `sortBy` | string | `createdAt` | `createdAt` \| `title` \| **`dueDate`** | **UPDATED** — `dueDate` is new |
| `sortDir` | string | `desc` | `asc` \| `desc` | Existing |
| `dueFilter` | string | — | **`overdue`** \| **`due-this-week`** | **NEW** — absent = no due-date filter |

#### dueFilter Semantics

| Value | Included todos |
|-------|---------------|
| `overdue` | `dueDate` is before today AND `completed` is `false` |
| `due-this-week` | `dueDate` is between today and today+7 (inclusive), regardless of `completed` |
| (absent) | No due-date filter applied |

`dueFilter` composes with `status` and `q` independently (all applied together via AND).

When `sortBy=dueDate`, todos without a `dueDate` sort to the bottom (nulls last), regardless of `sortDir`.

### Response

`200 OK`

```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "createdAt": "2026-06-08T10:00:00Z",
    "updatedAt": "2026-06-08T10:00:00Z",
    "dueDate": "2026-06-10"
  },
  {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "title": "Call dentist",
    "description": null,
    "completed": true,
    "createdAt": "2026-06-07T08:00:00Z",
    "updatedAt": "2026-06-07T09:00:00Z"
  }
]
```

Note: `dueDate` is omitted from the response object when null (Jackson `non_null` configuration).

### Error Responses

`400 Bad Request` — invalid parameter value:

```json
{
  "status": 400,
  "message": "Validation failed",
  "timestamp": "2026-06-08T10:00:00Z",
  "fieldErrors": {
    "dueFilter": "Invalid value 'banana'. Accepted values: overdue, due-this-week",
    "sortBy": "Invalid value 'invalid'. Accepted values: createdAt, title, dueDate"
  }
}
```

---

## POST /api/todos

Create a new todo.

### Request Body

```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "dueDate": "2026-06-10"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | Yes | 1–200 characters |
| `description` | string | No | max 1000 characters |
| `dueDate` | string | No | **NEW** — ISO date `"yyyy-MM-dd"`; omit for no due date |

### Response

`201 Created`

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "createdAt": "2026-06-08T10:00:00Z",
  "updatedAt": "2026-06-08T10:00:00Z",
  "dueDate": "2026-06-10"
}
```

### Error Responses

`400 Bad Request` — validation failure:

```json
{
  "status": 400,
  "message": "Validation failed",
  "timestamp": "2026-06-08T10:00:00Z",
  "fieldErrors": {
    "title": "must not be blank"
  }
}
```

Note: `dueDate` has no server-side format validation beyond Jackson's standard ISO date parsing. An invalid date string (e.g., `"not-a-date"`) returns `400` from Jackson deserialization with a generic malformed request message.

---

## GET /api/todos/{id}

Retrieve a single todo. Unchanged except response now includes `dueDate` when set.

### Response

`200 OK` — same shape as list item above.  
`404 Not Found` — unchanged.

---

## PUT /api/todos/{id}

Replace a todo (full update). **UPDATED** to accept `dueDate`.

### Request Body

```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "dueDate": "2026-06-12"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | Yes | 1–200 characters |
| `description` | string | No | max 1000 characters |
| `completed` | boolean | Yes | Existing |
| `dueDate` | string \| null | No | **NEW** — send `null` to clear a due date; omit or send date string to set |

### Response

`200 OK` — updated todo object (same shape as above).  
`404 Not Found` — unchanged.  
`400 Bad Request` — unchanged validation structure.

---

## PATCH /api/todos/{id}

Toggle completion status only. Unchanged — does not modify `dueDate`.

### Request Body

```json
{ "completed": true }
```

### Response

`200 OK` — updated todo object (same shape as above; `dueDate` unchanged).

---

## DELETE /api/todos/{id}

Unchanged.

### Response

`204 No Content`.  
`404 Not Found`.
