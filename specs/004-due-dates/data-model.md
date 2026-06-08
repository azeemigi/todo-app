# Data Model: Todo Due Dates

**Feature**: `004-due-dates` | **Date**: 2026-06-08

## Entities

### Todo (extended)

The existing `Todo` entity gains one new optional field. All existing fields are unchanged.

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `id` | `UUID` | No | Existing — unchanged |
| `title` | `String` | No | Existing — unchanged |
| `description` | `String` | Yes | Existing — unchanged |
| `completed` | `boolean` | No | Existing — unchanged |
| `createdAt` | `Instant` | No | Existing — unchanged |
| `updatedAt` | `Instant` | No | Existing — unchanged |
| `dueDate` | `LocalDate` | **Yes (NEW)** | Calendar date only; no time, no timezone |

**Invariants**:
- `dueDate` has no format constraint on the domain model — it is a calendar date.
- A todo without a `dueDate` (null) is in the same state as before this feature.
- `dueDate` may be set on completed todos; the overdue indicator is suppressed by the UI, not removed from the data.

---

## API DTOs

### CreateTodoRequest (extended)

| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `title` | `String` | `@NotBlank @Size(max=200)` | Existing |
| `description` | `String` | `@Size(max=1000)` | Existing |
| `dueDate` | `LocalDate` | None (optional, nullable) | **NEW** — omit or send `null` for no due date |

### UpdateTodoRequest (extended)

| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `title` | `String` | `@NotBlank @Size(max=200)` | Existing |
| `description` | `String` | `@Size(max=1000)` | Existing |
| `completed` | `Boolean` | `@NotNull` | Existing |
| `dueDate` | `LocalDate` | None (optional, nullable) | **NEW** — send `null` to clear an existing due date |

### TodoResponse (extended)

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `id` | `String` | No | Existing |
| `title` | `String` | No | Existing |
| `description` | `String` | Yes | Existing |
| `completed` | `boolean` | No | Existing |
| `createdAt` | `String` | No | Existing (ISO 8601 instant) |
| `updatedAt` | `String` | No | Existing (ISO 8601 instant) |
| `dueDate` | `String` | **Yes (NEW)** | ISO date `"yyyy-MM-dd"` or absent (null omitted by Jackson) |

---

## Enums

### SortBy (extended)

| Value | API string | Notes |
|-------|-----------|-------|
| `CREATED_AT` | `"createdAt"` | Existing |
| `TITLE` | `"title"` | Existing |
| `DUE_DATE` | `"dueDate"` | **NEW** — nulls sort to bottom |

### DueFilter (NEW)

| Value | API string | Filter behaviour |
|-------|-----------|-----------------|
| `OVERDUE` | `"overdue"` | `dueDate < today AND !completed` |
| `DUE_THIS_WEEK` | `"due-this-week"` | `dueDate >= today AND dueDate <= today + 7 days` |

When `dueFilter` is absent from the request, no due-date filter is applied.

---

## TypeScript Interfaces (Angular)

### Todo (extended)

```typescript
export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;  // NEW — "yyyy-MM-dd" or null (absent field treated as null)
}
```

### CreateTodoDto (extended)

```typescript
export interface CreateTodoDto {
  title: string;
  description?: string;
  dueDate?: string;  // NEW — "yyyy-MM-dd", omit for no due date
}
```

### UpdateTodoDto (extended)

```typescript
export interface UpdateTodoDto {
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string | null;  // NEW — "yyyy-MM-dd" or null to clear
}
```

### TodoFilter (extended)

```typescript
export interface TodoFilter {
  status?: string;
  q?: string;
  sortBy?: string;
  sortDir?: string;
  dueFilter?: string;  // NEW — "overdue" | "due-this-week"
}
```

---

## State Transitions

```
Todo created without dueDate
  → dueDate = null
  → No date shown on card; no indicators

Todo created with dueDate = "2026-06-15"
  → dueDate = "2026-06-15"
  → Card shows date badge based on today comparison

User edits todo, clears dueDate
  → PUT /api/todos/{id} with dueDate: null
  → dueDate = null
  → Card returns to no-date state

User edits todo, sets dueDate
  → PUT /api/todos/{id} with dueDate: "2026-06-20"
  → dueDate = "2026-06-20"

User completes a todo with an overdue dueDate
  → PATCH /api/todos/{id} { completed: true }
  → dueDate unchanged; UI suppresses urgency indicator
```

---

## Due Status Classification (client-side)

Computed at page-load using local calendar date. Applied in `TodoItemComponent`.

```
type DueStatus = 'overdue' | 'due-today' | 'future' | 'none';

function classify(todo: Todo, today: string): DueStatus {
  if (!todo.dueDate) return 'none';
  if (todo.completed) return 'none';   // completed todos suppress indicators
  if (todo.dueDate < today) return 'overdue';
  if (todo.dueDate === today) return 'due-today';
  return 'future';
}
```

(`today` is `new Date().toISOString().slice(0, 10)` captured once at component init.)
