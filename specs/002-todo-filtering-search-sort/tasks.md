# Tasks: TODO Filtering, Search, and Sort

**Input**: Design documents from `specs/002-todo-filtering-search-sort/`

**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ ✅ · quickstart.md ✅

**TDD mandate** (Constitution Principle I): Every implementation task MUST be preceded by a failing test task. Write the test, confirm it fails, then implement.

**Organization**: Tasks grouped by user story — each story delivers an independently testable vertical slice.

---

## Phase 1: Setup

**Purpose**: Verify clean baseline before making any changes.

- [X] T001 Run `mvn clean verify` on branch `003-todo-filtering-search-sort` and confirm BUILD SUCCESS before any changes are made (baseline)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared enums, frontend model, service infrastructure, and URL sync foundation required by ALL user stories. No user story work begins until this phase is complete.

**⚠️ CRITICAL**: US1–US5 all depend on T002–T010.

### Backend Enums (parallelizable)

- [X] T002 [P] Create `TodoStatus` enum (ALL="all", ACTIVE="active", COMPLETED="completed") in `todo-api/src/main/java/com/example/todoapi/model/TodoStatus.java`
- [X] T003 [P] Create `SortBy` enum (CREATED_AT="createdAt", TITLE="title") in `todo-api/src/main/java/com/example/todoapi/model/SortBy.java`
- [X] T004 [P] Create `SortDir` enum (DESC="desc", ASC="asc") in `todo-api/src/main/java/com/example/todoapi/model/SortDir.java`

### Frontend Model

- [X] T005 Add `TodoFilter` interface (`status?`, `q?`, `sortBy?`, `sortDir?` — all optional strings) to `todo-ui/src/app/models/todo.model.ts`

### Frontend Service Infrastructure

- [X] T006 Write failing tests for extended `loadTodos(filter?: TodoFilter)` in `todo-ui/src/app/services/todo.service.spec.ts`: verify `HttpParams` built correctly per filter field (omit absent/empty), verify generation counter causes second call to discard first response, verify API error sets error signal and clears loading
- [X] T007 Extend `TodoService.loadTodos(filter?: TodoFilter)` in `todo-ui/src/app/services/todo.service.ts`: build `HttpParams` from non-empty filter fields, add `private requestGen = 0` generation counter (increment on each call; subscribe callback returns early if `gen !== this.requestGen`), store `private lastFilter` and reuse it in CRUD-triggered reloads; update CRUD methods (`createTodo`, `updateTodo`, `patchTodo`, `deleteTodo`) to call `this.loadTodos(this.lastFilter)` after completion (passes T006)

### Angular Router Configuration

- [X] T008 Verify `todo-ui/src/app/app.config.ts` has `provideRouter([{path: '**', redirectTo: ''}])` or equivalent so `ActivatedRoute.queryParamMap` is injectable; add `provideRouter` with a wildcard SPA route if not already present

### Frontend Component URL Sync Infrastructure

- [X] T009 Write failing tests for `TodoListComponent` URL sync in `todo-ui/src/app/components/todo-list/todo-list.component.spec.ts`: on init `loadTodos()` called with filter derived from `ActivatedRoute` queryParams; `updateFilter({status: 'active'})` calls `router.navigate([], {queryParams, queryParamsHandling: 'merge'})`; invalid URL param value (e.g. `status='banana'`) falls back to default `'all'`
- [X] T010 Modify `TodoListComponent` in `todo-ui/src/app/components/todo-list/todo-list.component.ts`: inject `ActivatedRoute` + `Router`; add `private queryParams = toSignal(this.route.queryParamMap)` (import `toSignal` from `@angular/core/rxjs-interop`); derive `status()`, `q()`, `sortBy()`, `sortDir()` as `computed()` signals with valid-value fallback defaults; add `effect()` that calls `svc.loadTodos({status, q, sortBy, sortDir})` when queryParams change; add `updateFilter(changes: Partial<TodoFilter>)` that calls `router.navigate([], {queryParams: changes, queryParamsHandling: 'merge'})` (passes T009)
- [X] T011 Remove `effect(() => todoService.loadTodos())` from `AppComponent` constructor in `todo-ui/src/app/app.component.ts` (loading is now owned by `TodoListComponent`); update `todo-ui/src/app/app.component.spec.ts` accordingly

**Checkpoint**: Build must pass (`mvn clean verify`) before proceeding to user story phases.

---

## Phase 3: User Story 1 — Filter by Status (Priority: P1) 🎯 MVP

**Goal**: Users can narrow the list to All, Active, or Completed TODOs using filter controls. The URL reflects the selection. The API enforces valid enum values and returns 400 for invalid ones.

**Independent Test**: Seed mixed-status TODOs. Select Active → only incomplete TODOs shown and `?status=active` appears in URL. Reload → same view. `GET /api/todos?status=banana` → 400 with field error. No params → all TODOs newest-first (backward compat).

### Backend — US1

- [X] T012 [US1] Write failing tests for status filtering in `todo-api/src/test/java/com/example/todoapi/service/TodoServiceTest.java`: `findAll(ACTIVE, null, CREATED_AT, DESC)` returns only incomplete TODOs; `findAll(COMPLETED, ...)` returns only completed; `findAll(ALL, ...)` returns all
- [X] T013 [US1] Write failing tests for `?status` query param in `todo-api/src/test/java/com/example/todoapi/controller/TodoControllerTest.java`: `?status=active` → 200 with only active TODOs; `?status=completed` → 200 with only completed; `?status=all` → 200 with all; `?status=banana` → 400 with `{"errors":[{"field":"status","message":"..."}]}`; no params → 200 all newest-first (backward compat)
- [X] T014 [US1] Add `findAll(TodoStatus status, String q, SortBy sortBy, SortDir sortDir)` to `todo-api/src/main/java/com/example/todoapi/service/TodoService.java`: stream the `ConcurrentHashMap` values, filter by status (ALL = no filter, ACTIVE = `!completed`, COMPLETED = `completed`), leave `q` and sort as pass-through for now (returns unfiltered/unsorted beyond status); sort by `createdAt` desc as default (passes T012)
- [X] T015 [US1] Update `TodoController.getAllTodos()` in `todo-api/src/main/java/com/example/todoapi/controller/TodoController.java`: add `@RequestParam(defaultValue = "all") TodoStatus status`, `@RequestParam(required = false) String q`, `@RequestParam(defaultValue = "createdAt") SortBy sortBy`, `@RequestParam(defaultValue = "desc") SortDir sortDir`; pass all four to `todoService.findAll()` (passes T013)
- [X] T016 [US1] Add `MethodArgumentTypeMismatchException` handler to `todo-api/src/main/java/com/example/todoapi/exception/GlobalExceptionHandler.java`: extract the parameter name and attempted value, return `ResponseEntity` with status 400 and body `{"errors":[{"field":"<paramName>","message":"Invalid value '<value>' for parameter '<paramName>'. Accepted values: <enum-values>"}]}` (passes T013)

### Frontend — US1

- [X] T017 [US1] Write failing tests for `TodoListControlsComponent` status filter in `todo-ui/src/app/components/todo-list-controls/todo-list-controls.component.spec.ts`: clicking All/Active/Completed buttons emits `statusChange` with the correct string value; the button matching `currentStatus` input has active styling
- [X] T018 [US1] Create `TodoListControlsComponent` in `todo-ui/src/app/components/todo-list-controls/todo-list-controls.component.ts`: standalone, `@Input() currentStatus = 'all'`, `@Input() currentQ = ''`, `@Input() currentSortBy = 'createdAt'`, `@Input() currentSortDir = 'desc'`; `@Output() statusChange = new EventEmitter<string>()`; `@Output() searchChange = new EventEmitter<string>()`; `@Output() sortChange = new EventEmitter<{sortBy: string; sortDir: string}>()`; render three status buttons (All / Active / Completed) with active state (passes T017)
- [X] T019 [US1] Update `TodoListComponent` in `todo-ui/src/app/components/todo-list/todo-list.component.ts`: import `TodoListControlsComponent`; add `<app-todo-list-controls>` to template with `[currentStatus]="status()"` bound input and `(statusChange)="updateFilter({status: $event})"` output handler

**Checkpoint**: Status filter fully functional end-to-end — backend validates enums, frontend controls update URL, URL hydrates on reload.

---

## Phase 4: User Story 2 — Text Search (Priority: P2)

**Goal**: Users can type in a search box to find TODOs containing the query text in title or description. Search is case-insensitive, trims whitespace, and treats empty/whitespace-only queries as no filter.

**Independent Test**: Seed TODOs with known terms. Search `report` → only matching TODOs shown. Search `REPORT` → same results (case-insensitive). Clear search → full filtered list returns. `?q=   ` (whitespace) → treated as absent.

### Backend — US2

- [X] T020 [US2] Write failing tests for `q` text search in `todo-api/src/test/java/com/example/todoapi/service/TodoServiceTest.java`: `q="report"` matches title containing "report"; matches description containing "report"; case-insensitive match; `q="  "` (whitespace) treated as absent and returns all; `q=""` treated as absent
- [X] T021 [US2] Extend `TodoService.findAll()` in `todo-api/src/main/java/com/example/todoapi/service/TodoService.java`: after status filter, apply `q` filter — trim whitespace, skip filter if blank, otherwise `title.toLowerCase().contains(q.trim().toLowerCase()) || (description != null && description.toLowerCase().contains(...))` (passes T020)

### Frontend — US2

- [X] T022 [US2] Write failing tests for `TodoListControlsComponent` search input in `todo-ui/src/app/components/todo-list-controls/todo-list-controls.component.spec.ts`: typing in the search input emits `searchChange` with the current input value; clearing the input emits an empty string
- [X] T023 [US2] Add search input to `TodoListControlsComponent` in `todo-ui/src/app/components/todo-list-controls/todo-list-controls.component.ts`: render `<input type="text">` bound to `currentQ` input, emit `searchChange` on `(input)` event
- [X] T024 [US2] Update `TodoListComponent` in `todo-ui/src/app/components/todo-list/todo-list.component.ts`: bind `[currentQ]="q()"` on `<app-todo-list-controls>` and wire `(searchChange)="updateFilter({q: $event})"` output

**Checkpoint**: Text search fully functional — searching updates URL (`?q=report`), reloading restores search, combining with status filter works.

---

## Phase 5: User Story 3 — Sort TODOs (Priority: P3)

**Goal**: Users can sort TODOs by Newest (createdAt desc), Oldest (createdAt asc), Title A-Z (title asc), or Title Z-A (title desc). Sort is deterministic. Default is Newest.

**Independent Test**: Seed TODOs with different timestamps and titles. Select Title A-Z → list is alphabetically ascending. `?sortBy=banana` → API returns 400. No sort params → newest-first (backward compat).

### Backend — US3

- [X] T025 [US3] Write failing tests for sort in `todo-api/src/test/java/com/example/todoapi/service/TodoServiceTest.java`: `findAll(ALL, null, CREATED_AT, DESC)` returns newest first; `(ALL, null, CREATED_AT, ASC)` returns oldest first; `(ALL, null, TITLE, ASC)` returns alphabetically ascending by title; `(ALL, null, TITLE, DESC)` returns alphabetically descending; sort applies within a status-filtered set
- [X] T026 [US3] Write failing tests for `?sortBy` and `?sortDir` in `todo-api/src/test/java/com/example/todoapi/controller/TodoControllerTest.java`: `?sortBy=title&sortDir=asc` → 200 in A-Z order; `?sortBy=createdAt&sortDir=asc` → 200 oldest first; `?sortDir=sideways` → 400 with field "sortDir"; `?sortBy=priority` → 400 with field "sortBy"; both invalid in same request → 400 with two errors
- [X] T027 [US3] Extend `TodoService.findAll()` in `todo-api/src/main/java/com/example/todoapi/service/TodoService.java`: after status and q filters, apply sort — `Comparator.comparing(Todo::getCreatedAt)` or `Comparator.comparing(t -> t.getTitle().toLowerCase())`; apply `.reversed()` when `SortDir.DESC`; collect to list (passes T025, T026)

### Frontend — US3

- [X] T028 [US3] Write failing tests for `TodoListControlsComponent` sort selector in `todo-ui/src/app/components/todo-list-controls/todo-list-controls.component.spec.ts`: selecting Newest emits `sortChange` with `{sortBy:'createdAt', sortDir:'desc'}`; Oldest emits `{sortBy:'createdAt', sortDir:'asc'}`; Title A-Z emits `{sortBy:'title', sortDir:'asc'}`; Title Z-A emits `{sortBy:'title', sortDir:'desc'}`; selected option reflects `currentSortBy` and `currentSortDir` inputs
- [X] T029 [US3] Add sort selector (select or button group) to `TodoListControlsComponent` in `todo-ui/src/app/components/todo-list-controls/todo-list-controls.component.ts`: four options (Newest / Oldest / Title A-Z / Title Z-A); emit `sortChange` with `{sortBy, sortDir}` on change (passes T028)
- [X] T030 [US3] Update `TodoListComponent` in `todo-ui/src/app/components/todo-list/todo-list.component.ts`: bind `[currentSortBy]="sortBy()"` and `[currentSortDir]="sortDir()"` on `<app-todo-list-controls>`; wire `(sortChange)="updateFilter($event)"` output

**Checkpoint**: Sorting fully functional. All three controls (status, search, sort) work independently and in combination.

---

## Phase 6: User Story 4+5 — URL Persistence and Stale Response Integration

**Goal**: All four params persist across refresh, deep links, and browser back/forward. Invalid URL param values fall back silently to defaults. Stale responses from rapid control changes are discarded.

**Independent Test**: Set `?status=active&q=report&sortBy=title&sortDir=asc`, reload — identical view. Press Back after a filter change — prior state restored. Type quickly in search — final list matches only last query. `?status=foo` in URL → no error, defaults to All.

- [X] T031 [US4] Write failing tests in `todo-ui/src/app/components/todo-list/todo-list.component.spec.ts` for combined URL hydration: `?status=active&q=report&sortBy=title&sortDir=asc` on init → `loadTodos()` called with all four params; `?sortBy=banana` → `loadTodos()` called with `sortBy='createdAt'` (fallback); `?status=invalid` → `loadTodos()` called with `status='all'` (fallback)
- [X] T032 [US4] Write failing test in `todo-list.component.spec.ts` for browser back/forward: simulate `queryParamMap` observable emitting a second value (different params) → `loadTodos()` called again with updated params; verify URL state drives list state, not vice versa
- [X] T033 [US5] Write failing test in `todo-ui/src/app/services/todo.service.spec.ts` for stale response discarding: call `loadTodos({q:'r'})` then immediately `loadTodos({q:'report'})` before either resolves; flush only the first response → signal NOT updated; flush the second response → signal updated with second result
- [X] T034 [US5] Write failing test in `todo.service.spec.ts` for API error during control-triggered fetch: `loadTodos()` request returns 500 → `errorSignal` set, `loadingSignal` cleared; verify stale error (from superseded request) is also discarded by generation counter
- [X] T035 Verify `TodoListComponent` computed signals apply valid-value fallback and `TodoService` generation counter satisfies T031–T034; fix any edge cases surfaced by tests

**Checkpoint**: URL persistence and stale response safety confirmed across all control combinations.

---

## Phase 7: Polish and Cross-Cutting Concerns

**Purpose**: CRUD integration with active filters, empty-state UX, loading state, control layout styles, and final validation.

- [X] T036 Write test in `todo-list.component.spec.ts` for CRUD reload with active filter: after `svc.deleteTodo()` completes, `svc.loadTodos()` is called with the current filter (not reset to defaults); verify `TodoService.lastFilter` is reused in CRUD-triggered reloads
- [X] T037 Write test in `todo-list.component.spec.ts` for contextual empty state: when `svc.todos()` returns `[]` while a filter is active (status or q), a `.no-results` element is rendered with descriptive text; when no filter is active and list is empty, the existing empty-state message from feature 001 is shown
- [X] T038 Update `TodoListComponent` template in `todo-ui/src/app/components/todo-list/todo-list.component.ts` to show contextual empty-state message when `svc.todos().length === 0` (distinguish filtered-empty from truly-empty if status/q are active); show loading indicator (`svc.loading()`) scoped to the list area (passes T037)
- [X] T039 Add `TodoListControlsComponent` to `todo-list.component.spec.ts` test fixture imports if not already done; update `app.component.spec.ts` to verify `TodoListComponent` is imported (no regression from T011 change)
- [X] T040 [P] Add CSS for filter controls layout in `todo-ui/src/styles.css`: `.list-controls` horizontal flex row on desktop; stacks vertically on mobile (`flex-direction: column` at breakpoint); gap between status buttons, search input, and sort selector
- [X] T041 [P] Run all 10 quickstart.md validation steps against `mvn spring-boot:run -pl todo-api`: verify curl commands return expected responses; verify Angular browser scenarios (URL persistence, back/forward, empty state, stale response under Network throttling)
- [X] T042 Run `mvn clean verify` and confirm BUILD SUCCESS — all new and existing tests pass

---

## Dependencies and Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — run immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2 — delivers first vertical slice
- **Phase 4 (US2)**: Depends on Phase 2 — can start in parallel with Phase 3 if needed
- **Phase 5 (US3)**: Depends on Phase 2 — can start in parallel with Phase 3/4 if needed
- **Phase 6 (US4+US5)**: Depends on Phase 3, 4, 5 — requires all controls to be wired
- **Phase 7 (Polish)**: Depends on Phase 6 — final integration and validation

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|-----------|---------------------|
| US1 (Status Filter) | Phase 2 complete | US2, US3 (different files) |
| US2 (Text Search) | Phase 2 complete | US1, US3 (different service logic) |
| US3 (Sort) | Phase 2 complete | US1, US2 (different service logic) |
| US4+US5 (URL+Stale) | US1+US2+US3 complete | — |

### Within Each Phase

- Tests MUST be written and confirmed failing before implementation tasks
- Backend and frontend tasks within a story phase can be done in parallel (different file trees)
- All `[P]` tasks touch different files and have no inter-task dependencies

---

## Parallel Execution Examples

### Phase 2 Backend Enums (can run together)

```
Task: T002 — Create TodoStatus.java
Task: T003 — Create SortBy.java
Task: T004 — Create SortDir.java
```

### Phase 3 Backend + Frontend (can run in parallel after T002–T004)

```
Thread A (Backend): T012 → T013 → T014 → T015 → T016
Thread B (Frontend): T017 → T018 → T019
```

### Phase 7 Polish (T040 + T041 can run in parallel)

```
Task: T040 — CSS layout
Task: T041 — Quickstart validation
```

---

## Implementation Strategy

### MVP (US1 Only)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. Complete Phase 3 (US1 — Status Filter)
3. **Stop and validate**: `mvn clean verify` passes; status filter works end-to-end; URL persists; 400 on invalid enum
4. Ship MVP — users can filter by status

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 → Status filter (MVP ✅)
3. Phase 4 → Text search added
4. Phase 5 → Sort added
5. Phase 6 → URL persistence + stale response fully verified
6. Phase 7 → Polish, CRUD integration, full test suite green

---

## Notes

- `[P]` = touches different files, no dependency on other concurrent tasks
- `[US#]` = user story label for traceability
- Test tasks must run and **fail** before their paired implementation tasks
- `mvn clean verify` must stay green after every completed phase
- The `lastFilter` pattern in `TodoService` ensures CRUD-triggered reloads respect active filters without requiring the component to re-issue the load
- `toSignal(route.queryParamMap)` handles back/forward navigation automatically — no additional `popstate` listener needed
- Invalid URL param fallback is frontend-only; the API still enforces 400 for invalid programmatic calls
