# Research: Todo Due Dates

**Feature**: `004-due-dates` | **Date**: 2026-06-08

## Decisions

### 1. Date Representation

**Decision**: `LocalDate` on the backend; ISO `"yyyy-MM-dd"` string on the API wire; `string | null` in TypeScript.

**Rationale**: Due dates are calendar dates with no time or timezone component. `LocalDate` is the correct Java type — it has no time, no offset, no zone. Jackson with `write-dates-as-timestamps=false` serializes `LocalDate` as `"2026-06-15"`. The frontend receives and sends `string` in the same format. This matches the spec assumption: "date-only (no time or timezone component)."

**Alternatives considered**:
- `Instant` / `ZonedDateTime`: overkill; introduces timezone ambiguity for a date-only concept.
- `String` on backend: valid but loses type safety and native comparator support.

---

### 2. Overdue / Due-Today Classification

**Decision**: Client-side, at page-load time.

**Rationale**: The spec explicitly states: "Overdue/due-today comparisons are made against the local calendar date at the time of page load." A computed signal in `TodoItemComponent` reads the local date once (captured at component init) and classifies the due status. Completed todos always return `'none'` from the classifier.

**Alternatives considered**:
- Server-side classification (add a `dueStatus` field to `TodoResponse`): would require the server to know the client's local timezone. Rejected — adds complexity and violates the "simplicity first" principle.

---

### 3. Due-Date Filtering Strategy

**Decision**: Server-side, via a new `dueFilter` query parameter on `GET /api/todos`. Values: `overdue` | `due-this-week`.

**Rationale**: All existing filtering (status, search, sort) is server-side in `TodoService.findAll()`. Consistency demands the same for due-date filters. The server compares `todo.getDueDate()` against `LocalDate.now()` using Java's `LocalDate.isBefore()` and `isAfter()`.

**"Due this week" definition**: `dueDate >= today AND dueDate <= today.plusDays(7)` — inclusive of today and the 7th day, matching spec FR-010 ("between today and 7 days from today, inclusive").

**"Overdue" definition**: `dueDate != null AND dueDate.isBefore(today) AND !completed` — matching spec FR-009.

**Alternatives considered**:
- Client-side filtering after full list is fetched: rejected because it conflicts with the existing server-side filtering model and would break pagination if ever added.

---

### 4. Due-Date Sorting

**Decision**: Add `DUE_DATE("dueDate")` to the existing `SortBy` enum. Sort comparator uses `Comparator.nullsLast(Comparator.naturalOrder())` so todos without a due date fall to the bottom, matching FR-012.

**Rationale**: The existing sort pattern in `TodoService` uses a switch-expression over `SortBy`. Adding one more case is minimal-impact.

---

### 5. Jackson LocalDate Serialization

**Decision**: Add `spring.jackson.serialization.write-dates-as-timestamps=false` to `application.properties`. No additional dependency needed.

**Rationale**: Spring Boot auto-configures `jackson-datatype-jsr310` (included transitively via `spring-boot-starter-web`). The only requirement is disabling timestamp serialization so `LocalDate` emits `"yyyy-MM-dd"` strings. The project already has `spring.jackson.default-property-inclusion=non_null`, so a null `dueDate` is omitted from responses (clients treat a missing field as `null`).

---

### 6. Frontend Date Display

**Decision**: A new standalone `DueDatePipe` in `todo-ui/src/app/shared/pipes/` formats `"yyyy-MM-dd"` strings as `"Jun 15"` (same year) or `"Jun 15, 2027"` (different year).

**Rationale**: The pipe is reusable and keeps display logic out of components. It uses `Date` / `Intl.DateTimeFormat` for locale-aware month abbreviations — no third-party date library needed.

---

### 7. Angular Form Input for Due Date

**Decision**: Use `<input type="date">` (browser native date picker). Value binding via reactive forms — `dueDate` is a `FormControl<string>` in the `nonNullable` group (empty string = no due date).

**Rationale**: The spec says "browser's native date picker (no custom calendar widget required)." Native `<input type="date">` binds natively to `"yyyy-MM-dd"` strings, matching the API wire format exactly. Clearing the field sets value to `""`, which is sent as `null` (or omitted) on the API.

---

### 8. DueFilter Enum

**Decision**: New `DueFilter` enum in `com.example.todoapi.model` with values `OVERDUE("overdue")` and `DUE_THIS_WEEK("due-this-week")`. The `getAllTodos` controller method adds an optional `dueFilter` query param; if absent, no due-date filter is applied.

**Rationale**: Consistent with the existing `TodoStatus` and `SortBy` enum pattern. The controller's `parseEnum` helper can handle the new enum without modification — it uses `toString()` matching.

---

## Unresolved Items

None. All design decisions are resolved.
