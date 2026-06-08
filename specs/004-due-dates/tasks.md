# Tasks: Todo Due Dates

**Input**: Design documents from `/specs/004-due-dates/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Constitution**: Test-First is NON-NEGOTIABLE (Principle I). Test tasks are listed before their implementation counterparts within each phase. Write the test, confirm it fails (`mvn test` or `ng test`), then implement to make it pass.

**Organization**: Tasks are grouped by user story. Each story is independently testable after its phase completes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies)
- **[Story]**: User story label (US1, US2, US3)
- Exact file paths in every description

---

## Phase 1: Setup

**Purpose**: Configuration change required before any `LocalDate` can serialize correctly.

- [ ] T001 Add `spring.jackson.serialization.write-dates-as-timestamps=false` to `todo-api/src/main/resources/application.properties`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data model changes that all three user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Create `todo-api/src/test/java/com/example/todoapi/dto/TodoResponseTest.java` — write failing tests `shouldMapDueDateToIsoStringWhenDueDateIsSet` and `shouldOmitDueDateWhenNull` (confirm tests FAIL before proceeding to T004–T005)
- [ ] T003 [P] Update `todo-ui/src/app/core/models/todo.model.ts` — add `dueDate: string | null` to `Todo`; add `dueDate?: string` to `CreateTodoDto`; add `dueDate?: string | null` to `UpdateTodoDto`
- [ ] T004 Add `private LocalDate dueDate` field with `getDueDate()` and `setDueDate(LocalDate)` getter/setter to `todo-api/src/main/java/com/example/todoapi/model/Todo.java`
- [ ] T005 Update `todo-api/src/main/java/com/example/todoapi/dto/TodoResponse.java` — add `String dueDate` record component; update `from(Todo)` to call `todo.getDueDate() != null ? todo.getDueDate().toString() : null`
- [ ] T006 Run `mvn test -pl todo-api -Dtest=TodoResponseTest` — confirm `TodoResponseTest` now passes (both mapping tests green)

**Checkpoint**: `Todo` entity has `dueDate`; `TodoResponse` exposes it as ISO string; TypeScript interfaces updated. User story implementation can now begin.

---

## Phase 3: User Story 1 — Set a Due Date on a Todo (Priority: P1) 🎯 MVP

**Goal**: Users can add, edit, and clear a due date on any todo through the create and edit forms. Existing todos without a due date are unaffected.

**Independent Test**: Create a todo via `POST /api/todos` with `"dueDate": "2026-06-10"` and verify the response includes `"dueDate": "2026-06-10"`. Then `PUT /api/todos/{id}` with `"dueDate": null` and verify `dueDate` is absent from the response. See `quickstart.md` Scenarios 1 and 2.

### Tests for User Story 1

> **Write these tests FIRST — confirm they FAIL before any implementation below**

- [ ] T007 [P] [US1] Add `shouldCreateTodoWithDueDateWhenProvided` and `shouldCreateTodoWithNullDueDateWhenNotProvided` to `todo-api/src/test/java/com/example/todoapi/service/TodoServiceTest.java` (use `Given/When/Then` structure; assert `todo.getDueDate()` equals the provided `LocalDate`)
- [ ] T008 [P] [US1] Add `shouldReturn201WithDueDateInResponseWhenDueDateProvided`, `shouldUpdateDueDateWhenPutRequestIncludesDueDate`, and `shouldClearDueDateWhenPutRequestSendsNull` to `todo-api/src/test/java/com/example/todoapi/controller/TodoControllerTest.java` (use `@WebMvcTest`; assert `jsonPath("$.dueDate")`)
- [ ] T009 [P] [US1] Add `shouldSubmitWithDueDateWhenDateIsEntered` and `shouldSubmitWithNullDueDateWhenDateFieldIsEmpty` to `todo-ui/src/app/features/todo/todo-form/todo-form.component.spec.ts` (spy on `TodoService.create`; assert call args include/omit `dueDate`)
- [ ] T010 [P] [US1] Add `shouldPrePopulateDueDateFieldFromTodoInput` and `shouldClearDueDateWhenFieldIsEmptied` to `todo-ui/src/app/features/todo/todo-edit/todo-edit.component.spec.ts` (set `@Input() todo` with `dueDate`; assert form control value; spy on `TodoService.update`)

### Implementation for User Story 1

- [ ] T011 [P] [US1] Add `LocalDate dueDate` field to `todo-api/src/main/java/com/example/todoapi/dto/CreateTodoRequest.java` (no validation annotation — optional field)
- [ ] T012 [P] [US1] Add `LocalDate dueDate` field to `todo-api/src/main/java/com/example/todoapi/dto/UpdateTodoRequest.java` (no validation annotation — optional, nullable to allow clearing)
- [ ] T013 [US1] Update `TodoService.create()` and `TodoService.update()` in `todo-api/src/main/java/com/example/todoapi/service/TodoService.java` — accept `LocalDate dueDate` param; call `todo.setDueDate(dueDate)` in both methods; add `INFO` log for dueDate when non-null
- [ ] T014 [US1] Update `TodoController.createTodo()` and `TodoController.updateTodo()` in `todo-api/src/main/java/com/example/todoapi/controller/TodoController.java` — pass `request.dueDate()` to the corresponding service method
- [ ] T015 [US1] Update `TodoService.create()` and `TodoService.update()` in `todo-ui/src/app/core/services/todo.service.ts` — include `dueDate` in the request body (pass as-is; empty string maps to omit/null)
- [ ] T016 [US1] Add `dueDate: ['', []]` `FormControl` to the `nonNullable.group` in `todo-ui/src/app/features/todo/todo-form/todo-form.component.ts`; include `dueDate: value.dueDate || undefined` in the `CreateTodoDto` emitted on submit (empty string → omit field)
- [ ] T017 [US1] Update `todo-ui/src/app/features/todo/todo-form/todo-form.component.html` — add `<label>` + `<input type="date" formControlName="dueDate">` after the description field
- [ ] T018 [US1] Update `todo-ui/src/app/features/todo/todo-form/todo-form.component.scss` — add `.due-date-field` style (consistent with other form fields)
- [ ] T019 [US1] Add `dueDate: ['', []]` `FormControl` to the reactive form in `todo-ui/src/app/features/todo/todo-edit/todo-edit.component.ts`; pre-populate from `this.todo.dueDate ?? ''` in `ngOnInit`; include `dueDate: value.dueDate || null` in `UpdateTodoDto` on save (empty string → null to clear)
- [ ] T020 [US1] Update `todo-ui/src/app/features/todo/todo-edit/todo-edit.component.html` — add `<label>` + `<input type="date" formControlName="dueDate">` after the description field

**Checkpoint**: `POST /api/todos` and `PUT /api/todos/{id}` accept and return `dueDate`. Create and edit forms include a date picker. Clearing the field sends `null`, removing the date. Run `mvn clean verify` — all tests must pass.

---

## Phase 4: User Story 2 — Visual Due Status Indicators (Priority: P2)

**Goal**: Todo cards display an "Overdue" indicator (past due, incomplete), a "Due today" indicator (due today, incomplete), or the plain date (future). Completed todos show no urgency indicator regardless of due date.

**Independent Test**: With three todos — one with yesterday's date (incomplete), one with today's date (incomplete), one with tomorrow's date (incomplete) — verify the cards show "Overdue", "Due today", and the formatted future date respectively. A completed todo with yesterday's date must show no urgency indicator.

### Tests for User Story 2

> **Write these tests FIRST — confirm they FAIL before any implementation below**

- [ ] T021 [P] [US2] Create `todo-ui/src/app/shared/pipes/due-date.pipe.spec.ts` — write `shouldFormatDateAsDayMonthWhenSameYear`, `shouldFormatDateWithYearWhenDifferentYear`, and `shouldReturnEmptyStringWhenInputIsNull` (use `TestBed`; instantiate `DueDatePipe` directly)
- [ ] T022 [P] [US2] Add `shouldShowOverdueBadgeWhenDueDateBeforeTodayAndNotCompleted`, `shouldShowDueTodayBadgeWhenDueDateIsTodayAndNotCompleted`, `shouldShowFutureDateWithNoBadgeWhenDueDateIsAfterToday`, `shouldNotShowUrgencyBadgeWhenTodoIsCompleted`, and `shouldShowNoBadgeWhenNoDueDate` to `todo-ui/src/app/features/todo/todo-item/todo-item.component.spec.ts`

### Implementation for User Story 2

- [ ] T023 [US2] Create `todo-ui/src/app/shared/pipes/due-date.pipe.ts` — standalone `@Pipe({ name: 'dueDate', standalone: true, pure: true })` class `DueDatePipe implements PipeTransform`; `transform(value: string | null): string` — parse `"yyyy-MM-dd"` using `new Date(value + 'T00:00:00')`; format month as short name using `Intl.DateTimeFormat`; omit year when same as current year; return `''` for null
- [ ] T024 [US2] Update `todo-ui/src/app/features/todo/todo-item/todo-item.component.ts` — add `private readonly today = new Date().toISOString().slice(0, 10)` class field; add `readonly dueStatus = computed(() => { ... })` signal returning `'overdue' | 'due-today' | 'future' | 'none'` (null dueDate → `'none'`; completed todo → `'none'`; dueDate < today → `'overdue'`; dueDate === today → `'due-today'`; otherwise → `'future'`); import `DueDatePipe` in component imports
- [ ] T025 [US2] Update `todo-ui/src/app/features/todo/todo-item/todo-item.component.html` — add due date section below the title: `@if (dueStatus() !== 'none') { <span [class]="'due-badge due-' + dueStatus()"> @if (dueStatus() === 'overdue') { Overdue } @else if (dueStatus() === 'due-today') { Due today } @else { {{ todo.dueDate | dueDate }} } </span> }`
- [ ] T026 [US2] Update `todo-ui/src/app/features/todo/todo-item/todo-item.component.scss` — add `.due-badge` base style (small pill/tag); `.due-overdue` (red background or red text); `.due-today` (amber/orange); `.due-future` (muted grey text, no background)

**Checkpoint**: Todo cards show correct indicators based on due date and completion status. Run `ng test --watch=false --browsers=ChromeHeadless` — all Angular tests must pass.

---

## Phase 5: User Story 3 — Filter by Due Status (Priority: P3)

**Goal**: Filter controls include "Overdue" and "Due this week" buttons (composing with existing status filter). Sort controls include "Due date (soonest first)" and "Due date (latest first)" options. Todos without a due date sort to the bottom when a due-date sort is active. All filtering is server-side.

**Independent Test**: Run quickstart.md Scenarios 3–7 end-to-end with curl. Verify the filter buttons appear in the UI, drive URL params, and return correct results from the API.

### Tests for User Story 3

> **Write these tests FIRST — confirm they FAIL before any implementation below**

- [ ] T027 [P] [US3] Add `shouldReturnOnlyOverdueIncompleteTodosWhenDueFilterIsOverdue`, `shouldReturnTodosWithDueDateWithinSevenDaysWhenDueFilterIsDueThisWeek`, `shouldSortByDueDateAscendingWithNullsLastWhenSortByDueDate`, and `shouldSortByDueDateDescendingWithNullsLastWhenSortDirIsDesc` to `todo-api/src/test/java/com/example/todoapi/service/TodoServiceTest.java`
- [ ] T028 [P] [US3] Add `shouldReturnFilteredTodosWhenDueFilterIsOverdue`, `shouldReturnFilteredTodosWhenDueFilterIsDueThisWeek`, and `shouldReturn400WhenDueFilterValueIsInvalid` to `todo-api/src/test/java/com/example/todoapi/controller/TodoControllerTest.java`
- [ ] T029 [P] [US3] Add `shouldCallFindAllWithDueFilterWhenDueFilterParamPresentInUrl` and `shouldCallFindAllWithNoDueFilterWhenDueFilterParamAbsent` to `todo-ui/src/app/features/todo/todo-list/todo-list.component.spec.ts`
- [ ] T030 [P] [US3] Add `shouldEmitDueFilterChangeWhenOverdueButtonClicked`, `shouldEmitDueFilterChangeWhenDueThisWeekButtonClicked`, and `shouldEmitSortChangeWithDueDateWhenDueDateOptionSelected` to `todo-ui/src/app/features/todo/todo-list-controls/todo-list-controls.component.spec.ts`

### Implementation for User Story 3 (Backend)

- [ ] T031 [P] [US3] Create `todo-api/src/main/java/com/example/todoapi/model/DueFilter.java` — enum with `OVERDUE("overdue")` and `DUE_THIS_WEEK("due-this-week")`; `@JsonValue` on `getValue()`; `toString()` returns value string (follow `SortBy.java` pattern exactly)
- [ ] T032 [P] [US3] Add `DUE_DATE("dueDate")` constant to `todo-api/src/main/java/com/example/todoapi/model/SortBy.java` (follow existing `@JsonValue` + `toString()` pattern)
- [ ] T033 [US3] Update `TodoService.findAll()` in `todo-api/src/main/java/com/example/todoapi/service/TodoService.java` — add `DueFilter dueFilter` parameter (nullable); add stream filter after status filter: `OVERDUE` → `t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now()) && !t.isCompleted()`; `DUE_THIS_WEEK` → `t.getDueDate() != null && !t.getDueDate().isBefore(LocalDate.now()) && !t.getDueDate().isAfter(LocalDate.now().plusDays(7))`; add `DUE_DATE` case to sort switch using `Comparator.comparing(Todo::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))`
- [ ] T034 [US3] Update `TodoController.getAllTodos()` in `todo-api/src/main/java/com/example/todoapi/controller/TodoController.java` — add `@RequestParam(required = false) String dueFilter` parameter; parse using `parseEnum(DueFilter.class, "dueFilter", dueFilter, fieldErrors)` only when non-null; pass parsed `DueFilter` (or null) to `todoService.findAll()`

### Implementation for User Story 3 (Frontend)

- [ ] T035 [P] [US3] Add `dueFilter?: string` to `TodoFilter` in `todo-ui/src/app/core/models/todo.model.ts`
- [ ] T036 [P] [US3] Update `TodoService.findAll()` in `todo-ui/src/app/core/services/todo.service.ts` — add `if (filter?.dueFilter) params = params.set('dueFilter', filter.dueFilter)` (follows existing pattern)
- [ ] T037 [US3] Update `todo-ui/src/app/features/todo/todo-list/todo-list.component.ts` — add `VALID_DUE_FILTERS = ['overdue', 'due-this-week']` constant; add `readonly dueFilter = computed(() => { const v = this.queryParams().get('dueFilter') ?? ''; return VALID_DUE_FILTERS.includes(v) ? v : ''; })`; add `'dueDate'` to `VALID_SORT_BY`; include `dueFilter: this.dueFilter()` in every `loadTodos()` filter object; update `hasActiveFilter()` to also check `!!this.dueFilter()`; update inline template to pass `[currentDueFilter]="dueFilter()"` and `(dueFilterChange)="updateFilter({dueFilter: $event})"` to `<app-todo-list-controls>`
- [ ] T038 [US3] Update `todo-ui/src/app/features/todo/todo-list-controls/todo-list-controls.component.ts` — add `@Input() currentDueFilter = ''`; add `@Output() dueFilterChange = new EventEmitter<string>()` ; update `onSortChange()` to handle `'dueDate:asc'` and `'dueDate:desc'` values
- [ ] T039 [US3] Update the inline template in `todo-ui/src/app/features/todo/todo-list-controls/todo-list-controls.component.ts` — add due filter button group (`Overdue` emits `'overdue'`, `Due this week` emits `'due-this-week'`, `All` emits `''`); add `<option value="dueDate:asc">Due date (soonest first)</option>` and `<option value="dueDate:desc">Due date (latest first)</option>` to the sort `<select>`
- [ ] T040 [US3] Update `todo-ui/src/app/features/todo/todo-list-controls/todo-list-controls.component.scss` — add styles for due filter buttons (`.active` state matching status filter buttons)

**Checkpoint**: `GET /api/todos?dueFilter=overdue` returns only incomplete past-due todos. `GET /api/todos?sortBy=dueDate&sortDir=asc` sorts todos by due date ascending with nulls at bottom. Filter buttons in the UI drive URL params and trigger API calls. Run `mvn clean verify` — all 3 stories integrated, all tests green.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T041 Run `mvn clean verify` from repo root — confirm all backend and frontend tests pass; fix any compilation errors before proceeding
- [ ] T042 [P] Validate quickstart.md Scenarios 1–7 against the running application (`mvn spring-boot:run -pl todo-api`); curl each scenario and verify expected responses
- [ ] T043 [P] Start Angular dev server (`cd todo-ui && ng serve --proxy-config proxy.conf.json`) and validate all 14 items in quickstart.md UI Validation Checklist manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational completion — no dependency on US2/US3
- **US2 (Phase 4)**: Depends on Foundational completion — no dependency on US1
  - US1 and US2 touch different files and can run in parallel after Phase 2 if desired
- **US3 (Phase 5)**: Depends on Foundational completion — no dependency on US1/US2
  - Can start in parallel with US1 and US2 after Phase 2
- **Polish (Phase 6)**: Depends on all desired user stories complete

### User Story Dependencies

| Story | Can Start After | Depends On |
|-------|----------------|-----------|
| US1 (P1) | Phase 2 | T002–T006 |
| US2 (P2) | Phase 2 | T002–T006 |
| US3 (P3) | Phase 2 | T002–T006 |

### Within Each Phase

1. Tests marked [P] within a phase can be written in parallel (different files)
2. Tests MUST be written and confirmed FAILING before their matching implementation tasks
3. Backend implementation tasks (service before controller) must be sequential
4. Frontend tasks touching different components can be parallel

### Parallel Opportunities

```bash
# Phase 2 — write test + update model in parallel:
T002: TodoResponseTest.java (backend test)
T003: todo.model.ts (frontend model)

# Phase 3 — all test-writing tasks are parallel:
T007: TodoServiceTest.java additions
T008: TodoControllerTest.java additions
T009: todo-form.component.spec.ts additions
T010: todo-edit.component.spec.ts additions

# Phase 3 — backend DTO tasks are parallel:
T011: CreateTodoRequest.java
T012: UpdateTodoRequest.java

# Phase 4 — both test tasks are parallel:
T021: due-date.pipe.spec.ts (new file)
T022: todo-item.component.spec.ts additions

# Phase 5 — all four test tasks are parallel:
T027: TodoServiceTest.java additions
T028: TodoControllerTest.java additions
T029: todo-list.component.spec.ts additions
T030: todo-list-controls.component.spec.ts additions

# Phase 5 — backend enum tasks are parallel:
T031: DueFilter.java (new file)
T032: SortBy.java update

# Phase 5 — frontend model + service tasks are parallel:
T035: todo.model.ts (dueFilter addition)
T036: todo.service.ts (dueFilter param)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T006)
3. Complete Phase 3: US1 (T007–T020)
4. **STOP and VALIDATE**: `POST /api/todos` with `dueDate`; create form sends date; edit form pre-populates
5. Run `mvn clean verify` — green

### Incremental Delivery

1. Setup + Foundational → data model ready
2. Add US1 → create/edit forms accept due dates → MVP
3. Add US2 → cards show urgency indicators → value delivered
4. Add US3 → filter + sort by due date → feature complete
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With two developers after Phase 2:
- **Dev A**: US1 (forms: todo-form, todo-edit, backend DTOs + service + controller)
- **Dev B**: US2 (DueDatePipe, todo-item display) + US3 backend (DueFilter enum, service, controller)

---

## Notes

- `[P]` tasks touch different files with no incomplete dependencies
- `[Story]` label maps each task to its user story for traceability
- Every test task must produce a **failing** test before its implementation tasks begin (Constitution Principle I)
- Run `mvn clean verify` after each backend task group to keep the build green
- Commit after each phase or logical task group (`git commit -m "feat(api): ..."`)
- The `today` capture in `TodoItemComponent` uses `new Date().toISOString().slice(0, 10)` as a class field (not a signal) — this is intentional per the spec assumption that indicators are classified at page-load time
- `null` `dueDate` in `TodoResponse` is omitted by Jackson's `non_null` config — Angular must treat the absent field as `null` (the `Todo` interface uses `string | null` which accommodates this)
