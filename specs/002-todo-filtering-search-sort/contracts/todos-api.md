# API Contract: /api/todos — Filtering, Search, and Sort Extension

**Feature**: `002-todo-filtering-search-sort`
**Base URL**: `http://localhost:8080/api/todos`
**Content-Type**: `application/json`
**Date**: 2026-06-08
**Extends**: [feature 001 contract](../../001-todo-rest-spa/contracts/todos-api.md)

This document covers only the changes introduced in feature 002. All other endpoints (`POST`, `GET /{id}`, `PUT /{id}`, `PATCH /{id}`, `DELETE /{id}`) are **unchanged** from feature 001.

---

## GET /api/todos (updated)

Returns TODOs optionally filtered by status, searched by text, and sorted. All query parameters are optional and backward-compatible — omitting all params returns all TODOs newest-first (identical to feature 001 behavior).

### Query Parameters

| Parameter | Type | Values | Default | Description |
|-----------|------|--------|---------|-------------|
| `status` | string (enum) | `all`, `active`, `completed` | `all` | Filter by completion state |
| `q` | string | any | (none) | Case-insensitive substring search across title and description; whitespace-only is treated as absent |
| `sortBy` | string (enum) | `createdAt`, `title` | `createdAt` | Field to sort by |
| `sortDir` | string (enum) | `asc`, `desc` | `desc` | Sort direction |

### Response 200 OK — Default (no params)

Identical to feature 001: all TODOs ordered by `createdAt` descending.

```
GET /api/todos
```

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Submit monthly report",
    "description": "Finance team deadline",
    "completed": false,
    "createdAt": "2026-06-08T10:30:00Z",
    "updatedAt": "2026-06-08T10:30:00Z"
  }
]
```

### Response 200 OK — Status filter

```
GET /api/todos?status=active
```

Returns only TODOs where `completed = false`, ordered by `createdAt` descending.

```
GET /api/todos?status=completed
```

Returns only TODOs where `completed = true`, ordered by `createdAt` descending.

### Response 200 OK — Text search

```
GET /api/todos?q=report
```

Returns TODOs whose `title` or `description` contains `report` (case-insensitive substring match), ordered by `createdAt` descending.

### Response 200 OK — Sort options

```
GET /api/todos?sortBy=createdAt&sortDir=asc
```

Returns all TODOs ordered by `createdAt` ascending (oldest first).

```
GET /api/todos?sortBy=title&sortDir=asc
```

Returns all TODOs ordered by `title` lexicographically ascending (A-Z).

```
GET /api/todos?sortBy=title&sortDir=desc
```

Returns all TODOs ordered by `title` lexicographically descending (Z-A).

### Response 200 OK — Combined params

```
GET /api/todos?status=active&q=report&sortBy=title&sortDir=asc
```

Returns only active TODOs whose title or description contains `report`, sorted A-Z by title.

```json
[
  {
    "id": "...",
    "title": "Annual report review",
    "description": null,
    "completed": false,
    "createdAt": "2026-06-08T09:00:00Z",
    "updatedAt": "2026-06-08T09:00:00Z"
  }
]
```

### Response 200 OK — Empty result

When no TODOs match the given filter/search criteria, an empty array is returned (not a 404):

```json
[]
```

### Response 400 Bad Request — Invalid enum value

When `status`, `sortBy`, or `sortDir` is an unrecognised value, the API returns 400 using the existing error shape.

```
GET /api/todos?status=banana
```

```json
{
  "errors": [
    {
      "field": "status",
      "message": "Invalid value 'banana' for parameter 'status'. Accepted values: all, active, completed"
    }
  ]
}
```

```
GET /api/todos?sortBy=priority&sortDir=sideways
```

```json
{
  "errors": [
    {
      "field": "sortBy",
      "message": "Invalid value 'priority' for parameter 'sortBy'. Accepted values: createdAt, title"
    },
    {
      "field": "sortDir",
      "message": "Invalid value 'sideways' for parameter 'sortDir'. Accepted values: asc, desc"
    }
  ]
}
```

---

## Backward Compatibility Guarantee

The following equivalences hold:

| Before feature 002 | After feature 002 |
|--------------------|--------------------|
| `GET /api/todos` | `GET /api/todos` (unchanged) |
| `GET /api/todos` | `GET /api/todos?status=all&sortBy=createdAt&sortDir=desc` |

Any client that previously called `GET /api/todos` with no query params will receive identical behavior. No existing API contract is broken.

---

## Unchanged Endpoints

These endpoints from feature 001 are **not modified** by this feature:

- `POST /api/todos` — create
- `GET /api/todos/{id}` — get by ID
- `PUT /api/todos/{id}` — replace
- `PATCH /api/todos/{id}` — toggle completion
- `DELETE /api/todos/{id}` — delete

See [feature 001 contract](../../001-todo-rest-spa/contracts/todos-api.md) for their full specification.
