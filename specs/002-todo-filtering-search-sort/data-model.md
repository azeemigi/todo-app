# Data Model: TODO Filtering, Search, and Sort

**Feature**: `002-todo-filtering-search-sort`
**Date**: 2026-06-08
**Extends**: [feature 001 data model](../001-todo-rest-spa/data-model.md)

---

## Existing Entities (unchanged)

The `Todo` entity from feature 001 is unchanged:

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Server-generated, immutable |
| `title` | String | Required, 1–200 characters |
| `description` | String \| null | Optional, max 1000 characters |
| `completed` | boolean | Default false |
| `createdAt` | Instant | Server-generated, immutable |
| `updatedAt` | Instant | Server-set on every mutation |

---

## New: Query Parameter Enums (Backend)

These enums govern the valid values accepted by `GET /api/todos`. They serve as the authoritative validation layer for query parameters.

### `TodoStatus` (enum)

Controls which TODOs are included by completion state.

| Value | API String | Meaning |
|-------|-----------|---------|
| `ALL` | `all` | Include all TODOs regardless of completion (default) |
| `ACTIVE` | `active` | Include only TODOs where `completed = false` |
| `COMPLETED` | `completed` | Include only TODOs where `completed = true` |

Default: `ALL` (applied when `status` param is absent).

Spring MVC binding: `@RequestParam(defaultValue = "all") TodoStatus status`
Conversion: via `@JsonCreator` / Spring's enum conversion (case-insensitive or lowercase match).

### `SortBy` (enum)

Controls the field used for ordering results.

| Value | API String | Meaning |
|-------|-----------|---------|
| `CREATED_AT` | `createdAt` | Sort by creation timestamp (default) |
| `TITLE` | `title` | Sort by title string lexicographically |

Default: `CREATED_AT` (applied when `sortBy` param is absent).

### `SortDir` (enum)

Controls the direction of ordering.

| Value | API String | Meaning |
|-------|-----------|---------|
| `DESC` | `desc` | Descending order (default — newest first for `createdAt`) |
| `ASC` | `asc` | Ascending order (oldest first for `createdAt`; A-Z for `title`) |

Default: `DESC` (applied when `sortDir` param is absent).

---

## New: Frontend Query Model

### `TodoFilter` (TypeScript interface)

Represents the active filter/search/sort state held in URL query params and passed to the service.

```
TodoFilter {
  status?:  'all' | 'active' | 'completed'   // default 'all' when absent
  q?:       string                             // default '' (no filter) when absent
  sortBy?:  'createdAt' | 'title'             // default 'createdAt' when absent
  sortDir?: 'asc' | 'desc'                    // default 'desc' when absent
}
```

All fields are optional. A `TodoFilter` with all fields absent is equivalent to the default state (all TODOs, newest first), which matches the backward-compatible API behavior.

### `TodoListViewState` (derived — not persisted)

Computed within `TodoListComponent` from URL query params. Not stored independently; it IS the query param state.

| Derived field | Source | Fallback |
|---------------|--------|----------|
| `status` | `?status=` URL param | `'all'` |
| `q` | `?q=` URL param | `''` |
| `sortBy` | `?sortBy=` URL param | `'createdAt'` |
| `sortDir` | `?sortDir=` URL param | `'desc'` |

Invalid URL param values (e.g., `?status=banana`) are replaced with the fallback in the frontend without surfacing an error.

---

## Validation Rules for New Query Params

| Param | Valid values | Default | Invalid value behavior |
|-------|-------------|---------|----------------------|
| `status` | `all`, `active`, `completed` | `all` | API: 400; Frontend URL: fallback to default |
| `q` | Any string | (absent = no filter) | Whitespace-only treated as absent |
| `sortBy` | `createdAt`, `title` | `createdAt` | API: 400; Frontend URL: fallback to default |
| `sortDir` | `asc`, `desc` | `desc` | API: 400; Frontend URL: fallback to default |

---

## Relationships

```
TodoFilter ──uses──► TodoStatus (enum)
           ──uses──► SortBy (enum)
           ──uses──► SortDir (enum)
           ──applied to──► Todo[] (in-memory store)
```

No new persistence relationships are introduced. All query logic is applied transiently over the existing `ConcurrentHashMap<UUID, Todo>` at request time.
