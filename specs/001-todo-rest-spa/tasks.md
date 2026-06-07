---
description: "Task list for TODO REST API & Angular SPA"
---

# Tasks: TODO REST API & Angular SPA

**Input**: Design documents from `specs/001-todo-rest-spa/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Included in all phases — Constitution Principle I (Test-First) is NON-NEGOTIABLE.
Write each test task first, confirm it fails to compile or fails at runtime, then implement.

**Organization**: Tasks grouped by user story. Each story phase is an independently
testable increment.

## Format: `[ID] [P?] [Story?] Description — file path`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[US#]**: Maps to user story from spec.md
- Test tasks MUST precede their corresponding implementation tasks within each phase

## Path Conventions

```
todo-api/src/main/java/com/example/todoapi/   ← backend source
todo-api/src/test/java/com/example/todoapi/   ← backend tests
todo-ui/src/app/                               ← frontend source + specs
```

---

## Phase 1: Setup (Maven Multi-Module Project)

**Purpose**: Scaffold the parent POM and both child modules so `mvn clean verify` can
run (even if it just compiles an empty project). No story work until Phase 2 is done.

- [x] T001 Create parent `pom.xml` at repo root — declare modules `[todo-ui, todo-api]`, set `groupId=com.example`, `version=1.0.0-SNAPSHOT`, Java 25 compiler plugin, Spring Boot 3.5.14 BOM in `<dependencyManagement>`
- [x] T002 Create `todo-api/pom.xml` — parent ref, `artifactId=todo-api`, dependencies: `spring-boot-starter-web`, `spring-boot-starter-validation`, `spring-boot-starter-test`; `spring-boot-maven-plugin` for `spring-boot:run`
- [x] T003 [P] Create `todo-ui/pom.xml` — `artifactId=todo-ui`, `frontend-maven-plugin` with Node 24.16.0 / npm 11.13.0; executions: `install-node-and-npm` (generate-resources), `npm install` (generate-resources), `ng build` (compile), `ng test --watch=false --browsers=ChromeHeadless` (test)
- [x] T004 [P] Create `todo-api/src/main/java/com/example/todoapi/TodoApiApplication.java` — `@SpringBootApplication` main class
- [x] T005 [P] Create `todo-api/src/main/resources/application.properties` — `server.port=8080`
- [x] T006 Create Angular project skeleton in `todo-ui/` — `package.json` (Angular 22, zoneless), `angular.json` (outputPath: `dist/todo-ui/browser`), `todo-ui/src/main.ts`, `todo-ui/src/index.html`, `todo-ui/src/app/app.component.ts` (standalone, minimal), `todo-ui/src/app/app.config.ts` (`provideHttpClient()`, `provideRouter([])`)
- [x] T007 [P] Create `todo-ui/proxy.conf.json` — proxy `/api` to `http://localhost:8080` for `ng serve` dev mode
- [x] T008 Add `maven-resources-plugin` to `todo-api/pom.xml` — copy `${project.basedir}/../todo-ui/dist/todo-ui/browser/` to `${project.build.outputDirectory}/static/` bound to `generate-resources` phase

**Checkpoint**: `mvn clean verify` compiles both modules (Angular build + JUnit no-op pass). No story tasks before this passes.

---

## Phase 2: Foundational (Shared Backend + Frontend Infrastructure)

**Purpose**: Domain model, error handling, SPA routing, and the Angular service layer that
ALL user stories depend on. MUST be complete before any story phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Backend: Domain Model & Error Infrastructure

- [x] T009 Write failing `TodoServiceTest` in `todo-api/src/test/java/com/example/todoapi/service/TodoServiceTest.java` — test `findAll()` returns empty list (compile error expected until T010 exists)
- [x] T010 [P] Create `Todo` domain class in `todo-api/src/main/java/com/example/todoapi/model/Todo.java` — fields: `UUID id`, `String title`, `String description`, `boolean completed`, `Instant createdAt`, `Instant updatedAt`; mutable (not a record); getters/setters
- [x] T011 [P] Create `ErrorResponse` record in `todo-api/src/main/java/com/example/todoapi/exception/ErrorResponse.java` — `record ErrorResponse(List<FieldError> errors)`
- [x] T012 [P] Create `FieldError` record in `todo-api/src/main/java/com/example/todoapi/exception/FieldError.java` — `record FieldError(String field, String message)`
- [x] T013 Create `GlobalExceptionHandler` in `todo-api/src/main/java/com/example/todoapi/exception/GlobalExceptionHandler.java` — `@RestControllerAdvice`; handle: `MethodArgumentNotValidException` → 400 + errors array, `NoSuchElementException` → 404 + `[{field:"id",message:"TODO not found"}]`, `Exception` → 500 + `[{field:"server",message:"An unexpected error occurred"}]`
- [x] T014 Create `TodoService` skeleton in `todo-api/src/main/java/com/example/todoapi/service/TodoService.java` — `@Service`, `ConcurrentHashMap<UUID, Todo>`, implement `findAll()` returning values sorted by `createdAt` descending — T009 must now pass
- [x] T015 [P] Create `SpaFallbackController` in `todo-api/src/main/java/com/example/todoapi/config/SpaFallbackController.java` — `@Controller`, `@GetMapping("/{path:[^.]*}")`, returns `"forward:/index.html"` to support Angular HTML5 routing

### Frontend: Models & Shared Service

- [x] T016 [P] Create `todo-ui/src/app/models/todo.model.ts` — TypeScript interfaces: `Todo`, `CreateTodoDto`, `UpdateTodoDto`, `PatchTodoDto`, `FieldError`, `ApiError`
- [x] T017 Write failing `todo.service.spec.ts` in `todo-ui/src/app/services/todo.service.spec.ts` — specs for: `loadTodos()` calls GET /api/todos and sets todos signal, `createTodo()` calls POST and prepends result, `patchTodo()` calls PATCH and updates signal, `updateTodo()` calls PUT and replaces item, `deleteTodo()` calls DELETE and removes item from signal; use `HttpClientTestingModule`
- [x] T018 Create `TodoService` in `todo-ui/src/app/services/todo.service.ts` — `injectable({providedIn:'root'})`, private `todos = signal<Todo[]>([])`, `loading = signal(false)`, `error = signal<string|null>(null)`; expose via `readonly` computed; implement all 5 API methods using `HttpClient`, update signal on success, set `error` on failure — T017 must now pass

**Checkpoint**: `mvn clean verify` passes. `TodoServiceTest` and `todo.service.spec.ts` both green. Foundation ready.

---

## Phase 3: User Story 1 — View and Browse TODOs (Priority: P1) 🎯 MVP

**Goal**: User opens the app and sees the full TODO list newest-first, with loading,
empty-state, and error states. Works on mobile and desktop.

**Independent Test**: Seed TODOs via `curl`, open `http://localhost:8080`, confirm list
renders newest-first with all fields; resize to 375px and confirm no horizontal scroll.

### Tests — Write and confirm FAILING before implementing

- [x] T019 Write failing `TodoControllerTest.getAllTodos_returnsEmptyList()` and `getAllTodos_returnsTodosNewestFirst()` in `todo-api/src/test/java/com/example/todoapi/controller/TodoControllerTest.java` — use `@WebMvcTest(TodoController.class)` with mocked `TodoService`
- [x] T020 [P] Write failing `TodoListComponent` spec in `todo-ui/src/app/components/todo-list/todo-list.component.spec.ts` — specs: renders empty-state when todos=[], renders cards when todos populated, shows loading indicator when loading=true, shows error message when error is set
- [x] T021 [P] Write failing `TodoItemComponent` spec in `todo-ui/src/app/components/todo-item/todo-item.component.spec.ts` — specs: renders title, shows description when present, hides description when null, shows creation date, applies completed CSS class when completed=true

### Implementation

- [x] T022 [P] Create `TodoResponse` record in `todo-api/src/main/java/com/example/todoapi/dto/TodoResponse.java` — `record TodoResponse(String id, String title, String description, boolean completed, String createdAt, String updatedAt)`; include static factory `from(Todo todo)` formatting `Instant` as ISO-8601
- [x] T023 Create `TodoController` in `todo-api/src/main/java/com/example/todoapi/controller/TodoController.java` — `@RestController`, `@RequestMapping("/api/todos")`, constructor injection of `TodoService`; implement `GET /api/todos` returning `List<TodoResponse>` — T019 must now pass
- [x] T024 Create `TodoListComponent` in `todo-ui/src/app/components/todo-list/todo-list.component.ts` — standalone, reads `todoService.todos` signal and `loading`/`error` signals; shows loading spinner, error message with retry button, empty-state message, or list of `TodoItemComponent`s — T020 must now pass
- [x] T025 Create `TodoItemComponent` in `todo-ui/src/app/components/todo-item/todo-item.component.ts` — standalone, `@Input() todo: Todo`; displays title, description (hidden when null), completion badge, `createdAt` formatted date; applies `completed` CSS class to card — T021 must now pass
- [x] T026 Wire `TodoListComponent` into `todo-ui/src/app/app.component.ts` — import and render `TodoListComponent`; call `todoService.loadTodos()` inside an `effect()` in the constructor (zoneless app — do not use `ngOnInit`)

**Checkpoint**: `mvn spring-boot:run -pl todo-api` → open `http://localhost:8080` → empty-state message visible. `curl -X POST http://localhost:8080/api/todos -H "Content-Type: application/json" -d '{"title":"Test"}'` → reload → card appears. Mobile viewport: no horizontal scroll.

---

## Phase 4: User Story 2 — Create a New TODO (Priority: P2)

**Goal**: User submits a form with title and optional description; new TODO appears at
the top of the list immediately; form resets. Validation prevents blank/oversized input.

**Independent Test**: Fill create form, submit — new card appears at top of list without
reload. Submit empty title — field error shown, no API call made.

### Tests — Write and confirm FAILING before implementing

- [x] T027 Write failing `TodoControllerTest.createTodo_returnsCreated()`, `createTodo_blankTitle_returns400()`, `createTodo_titleTooLong_returns400()`, `createTodo_descriptionTooLong_returns400()` in `todo-api/src/test/java/com/example/todoapi/controller/TodoControllerTest.java`
- [x] T028 [P] Write failing `TodoFormComponent` spec in `todo-ui/src/app/components/todo-form/todo-form.component.spec.ts` — specs: submit with valid title calls `todoService.createTodo()`, empty title shows validation error without calling service, title >200 chars shows validation error, description >1000 chars shows validation error, form resets on success, form retains values + shows error on API failure

### Implementation

- [x] T029 Create `CreateTodoRequest` record in `todo-api/src/main/java/com/example/todoapi/dto/CreateTodoRequest.java` — `record CreateTodoRequest(@NotBlank @Size(min=1,max=200) String title, @Size(max=1000) String description)`
- [x] T030 Implement `createTodo(CreateTodoRequest)` in `todo-api/src/main/java/com/example/todoapi/service/TodoService.java` — generates `UUID.randomUUID()`, sets `createdAt`/`updatedAt` to `Instant.now()`, stores in map, returns new `Todo`; add `POST /api/todos` to `TodoController` with `@Valid @RequestBody`, return 201 — T027 must now pass
- [x] T031 Create `TodoFormComponent` in `todo-ui/src/app/components/todo-form/todo-form.component.ts` — standalone; reactive form with `title` (`required`, `minLength(1)`, `maxLength(200)`) and `description` (`maxLength(1000)`); on submit: call `todoService.createTodo()`, reset form on success, show server error message on failure; display field-level validation errors beside each input — T028 must now pass
- [x] T032 Add `TodoFormComponent` to `todo-ui/src/app/app.component.ts` — render above `TodoListComponent`

**Checkpoint**: Create form visible at top. Submit `"Buy groceries"` → card appears at top of list. Submit blank → error shown. `mvn clean verify` still green.

---

## Phase 5: User Story 3 — Mark Complete / Incomplete (Priority: P3)

**Goal**: Checkbox on each TODO card toggles completion state. Visual style updates
immediately. Reverts on API failure.

**Independent Test**: Click checkbox on a TODO → card style changes (strikethrough).
Click again → reverts. Reload page → state persists (API was updated).

### Tests — Write and confirm FAILING before implementing

- [x] T033 Write failing `TodoControllerTest.patchTodo_marksComplete()`, `patchTodo_marksIncomplete()`, `patchTodo_notFound_returns404()`, `patchTodo_missingCompleted_returns400()` in `todo-api/src/test/java/com/example/todoapi/controller/TodoControllerTest.java`
- [x] T034 [P] Extend `TodoItemComponent` spec in `todo-ui/src/app/components/todo-item/todo-item.component.spec.ts` — new specs: clicking checkbox calls `todoService.patchTodo()` with toggled value, checkbox is disabled while request in-flight, on success applies completed class, on failure reverts checkbox state and shows error

### Implementation

- [x] T035 Create `PatchTodoRequest` record in `todo-api/src/main/java/com/example/todoapi/dto/PatchTodoRequest.java` — `record PatchTodoRequest(@NotNull Boolean completed)`
- [x] T036 Implement `patchTodo(UUID, boolean)` in `todo-api/src/main/java/com/example/todoapi/service/TodoService.java` — finds Todo (throws `NoSuchElementException` if absent), sets `completed` + `updatedAt`, stores back; add `PATCH /api/todos/{id}` to `TodoController` with `@Valid @RequestBody` — T033 must now pass
- [x] T037 Add checkbox toggle to `todo-ui/src/app/components/todo-item/todo-item.component.ts` — checkbox bound to `todo.completed`; on change: disable checkbox, call `todoService.patchTodo(todo.id, newValue)`; on success: re-enable; on failure: revert to original value, re-enable, show inline error — T034 must now pass
- [x] T049 [P] [US3] Apply completed visual CSS rules in `todo-ui/src/app/components/todo-item/todo-item.component.ts` (and/or a companion `.css` file) — add strikethrough on title text and muted/grey card background when `todo.completed === true`; the CSS class is already applied by T025, so these rules are additive and parallelisable with T037 — fulfils US3 acceptance criterion "visual style updates to indicate completion" and FR-019

**Checkpoint**: Checkbox toggles completion. Completed cards show strikethrough title and muted background immediately. Rapid clicking: second click is disabled while first is in-flight. `mvn clean verify` green.

---

## Phase 6: User Story 4 — Edit an Existing TODO (Priority: P4)

**Goal**: Edit button on each card opens a pre-populated form. User changes title and/or
description, saves, and the updated values appear in the list immediately without reload.

**Independent Test**: Click edit → form opens pre-populated. Change title → save → new
title in card. Cancel → no change. Save with blank title → validation error shown.

### Tests — Write and confirm FAILING before implementing

- [x] T038 Write failing `TodoControllerTest.updateTodo_returnsUpdated()`, `updateTodo_notFound_returns404()`, `updateTodo_blankTitle_returns400()`, `updateTodo_missingCompleted_returns400()` in `todo-api/src/test/java/com/example/todoapi/controller/TodoControllerTest.java`
- [x] T039 [P] Write failing `TodoEditComponent` spec in `todo-ui/src/app/components/todo-edit/todo-edit.component.spec.ts` — specs: form is pre-populated with current title and description, save calls `todoService.updateTodo()`, blank title shows validation error and blocks save, cancel emits close event without API call, on API failure form stays open and shows error

### Implementation

- [x] T040 Create `UpdateTodoRequest` record in `todo-api/src/main/java/com/example/todoapi/dto/UpdateTodoRequest.java` — `record UpdateTodoRequest(@NotBlank @Size(min=1,max=200) String title, @Size(max=1000) String description, @NotNull Boolean completed)`
- [x] T041 Implement `updateTodo(UUID, UpdateTodoRequest)` in `todo-api/src/main/java/com/example/todoapi/service/TodoService.java` — finds Todo, replaces `title`/`description`/`completed`, updates `updatedAt`; add `PUT /api/todos/{id}` to `TodoController` — T038 must now pass
- [x] T042 Create `TodoEditComponent` in `todo-ui/src/app/components/todo-edit/todo-edit.component.ts` — standalone; `@Input() todo: Todo`; `@Output() saved = new EventEmitter<Todo>()`; `@Output() cancelled = new EventEmitter<void>()`; reactive form pre-populated with `todo.title`/`todo.description`; validates title (required, 1-200), description (0-1000); calls `todoService.updateTodo()` on save; shows field-level errors; emits `saved` on success, `cancelled` on cancel; stays open on API failure — T039 must now pass
- [x] T043 Wire `TodoEditComponent` into `todo-ui/src/app/components/todo-item/todo-item.component.ts` — edit button toggles visibility of `TodoEditComponent`; on `saved`: close the edit form (the list reflects updated values automatically via the `TodoService` signal); on `cancelled`: hide form

**Checkpoint**: Edit form opens pre-populated. Title updated → card title updates. Cancel → no change. Invalid title → error shown. `mvn clean verify` green.

---

## Phase 7: User Story 5 — Delete a TODO (Priority: P5)

**Goal**: Delete button on each card shows a confirmation prompt. Confirmed delete removes
the card immediately. Cancelled delete leaves the card intact.

**Independent Test**: Click delete → confirmation shown. Cancel → card stays. Confirm →
card removed. `GET /api/todos` confirms item is gone.

### Tests — Write and confirm FAILING before implementing

- [x] T044 Write failing `TodoControllerTest.deleteTodo_returnsNoContent()`, `deleteTodo_notFound_returns404()` in `todo-api/src/test/java/com/example/todoapi/controller/TodoControllerTest.java`
- [x] T045 [P] Extend `TodoItemComponent` spec in `todo-ui/src/app/components/todo-item/todo-item.component.spec.ts` — new specs: delete button shows confirmation, cancel keeps card visible, confirm calls `todoService.deleteTodo()`, on success card is removed from list (via service signal update), on API failure card stays and error shown

### Implementation

- [x] T046 Implement `deleteTodo(UUID)` in `todo-api/src/main/java/com/example/todoapi/service/TodoService.java` — removes from map (throws `NoSuchElementException` if absent); add `DELETE /api/todos/{id}` to `TodoController` returning `ResponseEntity<Void>` with 204 — T044 must now pass
- [x] T047 Add delete with confirmation to `todo-ui/src/app/components/todo-item/todo-item.component.ts` — delete button sets `confirming = signal(true)`; shows inline confirmation (`"Delete?"` + Confirm / Cancel buttons); Confirm: calls `todoService.deleteTodo(todo.id)`, on success item disappears (signal updated in service), on failure `confirming = false` + show error; Cancel: `confirming = false` — T045 must now pass

**Checkpoint**: Full CRUD cycle works end-to-end. All 9 quickstart.md validation scenarios pass. `mvn clean verify` green.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Responsive styling, individual GET endpoint, and final validation.

- [x] T048 Add responsive CSS to `todo-ui/src/styles.css` — mobile-first: single-column card layout at 320px+; desktop two-column grid at 1280px+; max card width, padding, font sizes; ensure no horizontal scroll at 375px or 1280px viewports
- [x] T050a [P] Write failing `TodoControllerTest.getTodoById_returnsItem()` and `getTodoById_notFound_returns404()` in `todo-api/src/test/java/com/example/todoapi/controller/TodoControllerTest.java` — confirm test fails to compile (`TodoController` has no `GET /{id}` method yet)
- [x] T050b [P] Add `findById(UUID id)` returning `Optional<Todo>` to `todo-api/src/main/java/com/example/todoapi/service/TodoService.java`; implement `GET /api/todos/{id}` in `todo-api/src/main/java/com/example/todoapi/controller/TodoController.java` returning `TodoResponse` on success or 404 via `GlobalExceptionHandler` — T050a must now pass
- [x] T051 [P] Verify debounce/disable on completion checkbox — confirm `TodoItemComponent` disables checkbox during in-flight PATCH request (covered by T034 spec); if not already enforced, add `disabled` binding tied to a `toggling = signal(false)` flag in `todo-ui/src/app/components/todo-item/todo-item.component.ts`
- [x] T052 Run `mvn clean verify` from repo root — confirm `BUILD SUCCESS`; all JUnit 5 tests green; all Karma/Jasmine tests green; zero failures, zero errors
- [x] T053 Run all 9 validation scenarios from `specs/001-todo-rest-spa/quickstart.md` against `mvn spring-boot:run -pl todo-api` — confirm each expected outcome matches actual behaviour

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user story phases
- **US1 (Phase 3)**: Depends on Phase 2 — first story, no story dependencies
- **US2 (Phase 4)**: Depends on Phase 2 — independent of US1; can start in parallel with US1 if staffed
- **US3 (Phase 5)**: Depends on Phase 2 — independent of US1/US2; requires `PatchTodoRequest` and `PATCH` endpoint
- **US4 (Phase 6)**: Depends on Phase 2 — independent of US1/US2/US3; requires `UpdateTodoRequest` and `PUT` endpoint
- **US5 (Phase 7)**: Depends on Phase 2 — independent of US1–US4; requires `DELETE` endpoint
- **Polish (Phase 8)**: Depends on all story phases complete

### Within Each Phase

```
Tests (write + confirm failing) → Models/DTOs → Service methods → Controller endpoint → Frontend spec → Frontend component → Wire into app
```

### Parallel Opportunities Within Each Phase

```
# Phase 2 — run in parallel:
T010 (Todo model)  |  T011 (ErrorResponse)  |  T012 (FieldError)

# Phase 3 — run in parallel (after T022):
T020 (TodoListComponent spec)  |  T021 (TodoItemComponent spec)

# Phase 3 — run in parallel (after T023):
T024 (TodoListComponent impl)  |  T025 (TodoItemComponent impl)

# Phase 5 — run in parallel:
T033 (backend PATCH test)  |  T034 (frontend checkbox spec)
# After T033/T034 complete, T037 and T049 are parallelisable (different files — .ts logic vs CSS rules):
T037 (checkbox toggle impl)  |  T049 (completed CSS rules)

# Phase 6 — run in parallel:
T038 (backend PUT test)  |  T039 (TodoEditComponent spec)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — **CRITICAL, blocks everything**
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: `mvn spring-boot:run -pl todo-api` → open app → list loads, empty state shows, mobile layout works
5. Show/demo if ready — the app displays TODOs with loading/error/empty states

### Incremental Delivery

1. Phase 1 + Phase 2 → build infrastructure + shared model
2. Phase 3 (US1) → viewable list → **Demo: "I can see my TODOs"**
3. Phase 4 (US2) → creation form → **Demo: "I can create TODOs"**
4. Phase 5 (US3) → checkbox toggle → **Demo: "I can complete TODOs"**
5. Phase 6 (US4) → edit form → **Demo: "I can update TODOs"**
6. Phase 7 (US5) → delete with confirm → **Demo: full CRUD**
7. Phase 8 → responsive styling + final verification → **Ship**

---

## Notes

- [P] = different files, no intra-phase dependency — safe to implement simultaneously
- [US#] = traceability to user story in spec.md
- Constitution Principle I: every test task MUST be written and confirmed failing BEFORE the paired implementation task
- After each phase checkpoint: run `mvn clean verify` to confirm nothing regressed
- `TodoControllerTest` grows incrementally — add new test methods per phase rather than rewriting the class
- `TodoItemComponent` also grows incrementally — add specs/behaviour per phase (US1 display → US3 checkbox → US5 delete)
