# Research: TODO REST API & Angular SPA

**Branch**: `001-todo-rest-spa` | **Date**: 2026-06-07

All technical decisions were supplied by the user. This document records the
rationale, key integration points verified, and alternatives considered.

---

## Decision 1: Maven Multi-Module Structure

**Decision**: Parent POM with two child modules — `todo-api` (Spring Boot) and
`todo-ui` (Angular via `frontend-maven-plugin`).

**Rationale**: Single build command (`mvn clean verify`) covers compilation, frontend
bundling, and all tests. The parent POM orchestrates module ordering: `todo-ui` builds
first so its dist output is available before `maven-resources-plugin` copies it into
`todo-api/src/main/resources/static/`.

**Key integration point**: Module build order in parent POM must list `todo-ui` before
`todo-api` in `<modules>`. The `maven-resources-plugin` copy is configured in
`todo-api/pom.xml` bound to the `generate-resources` phase, which runs after
`todo-ui`'s `package` phase completes.

**Alternatives considered**:
- Separate repos / separate CI pipelines — rejected; violates FR-020 (single command).
- Gradle — rejected; constitution specifies Maven.

---

## Decision 2: frontend-maven-plugin Configuration

**Decision**: Use `eirslett/frontend-maven-plugin` to install Node 24.16.0 / npm
11.13.0 locally under `todo-ui/.node/`, then run `npm install`, `ng build`, and
`ng test --watch=false --browsers=ChromeHeadless` as Maven execution goals.

**Rationale**: Avoids requiring Node/npm pre-installed on the build machine. The
plugin downloads the correct version into the project directory and uses it for all
subsequent executions.

**Key integration points**:
- `installNode` execution: phase `generate-resources`, downloads Node + npm.
- `npm install` execution: phase `generate-resources` (after installNode).
- `ng build` execution: phase `compile`, outputs to `todo-ui/dist/todo-ui/browser/`.
- `ng test` execution: phase `test`, must pass with exit code 0 for `verify` to
  succeed. Uses ChromeHeadless — Chrome must be available on the CI/build machine.
- `angular.json` `outputPath` must match the source path used in
  `maven-resources-plugin`'s `<directory>` config.

**Alternatives considered**:
- Manually running `npm install && ng build` before Maven — rejected; breaks the
  single-command requirement.
- Running `ng test` outside Maven — rejected; clarification Q4 resolved this as
  in-scope for `mvn clean verify`.

---

## Decision 3: SPA HTML5 Routing Fallback

**Decision**: A `SpaFallbackController` annotated with `@Controller` (not
`@RestController`) serves `index.html` for any request path that does not match
`/api/**` and does not resolve to an existing static resource.

**Rationale**: Angular's router uses HTML5 `pushState` URLs (e.g., `/todos/42`).
Without a fallback, Spring Boot returns 404 for direct URL entry or page refresh on
Angular-managed routes. The fallback must be ordered after the static resource handler
and must not intercept API paths.

**Implementation note**: Map the fallback to `/{path:[^.]*}` to exclude paths
containing a dot (`.`), which are assumed to be static file requests that should 404
naturally if absent.

**Alternatives considered**:
- Hash-based routing (`#`) in Angular — rejected; produces ugly URLs and is
  non-standard for modern SPAs.
- Configuring Spring's `spring.mvc.static-path-pattern` — insufficient alone; still
  needs a controller catch-all for non-existent paths.

---

## Decision 4: Error Response Shape

**Decision**: All 400 validation errors return:
```json
{
  "errors": [
    { "field": "title", "message": "must not be blank" }
  ]
}
```
Implemented as Java records `ErrorResponse(List<FieldError> errors)` and
`FieldError(String field, String message)`.

**Rationale**: Chosen in clarification Q1 (simple array). Spring's
`MethodArgumentNotValidException` (thrown by `@Valid` on `@RequestBody`) provides
`BindingResult.getFieldErrors()`, which maps directly to this shape with no extra
libraries.

The `@RestControllerAdvice` (`GlobalExceptionHandler`) handles:
- `MethodArgumentNotValidException` → 400 with errors array
- `NoSuchElementException` (or a custom `TodoNotFoundException`) → 404 with
  `{"errors":[{"field":"id","message":"TODO not found"}]}`
- Unhandled exceptions → 500 with a generic message (no stack trace exposed)

**Alternatives considered**:
- RFC 7807 ProblemDetail — rejected in clarification Q1; unnecessary complexity.
- Map-style errors `{"errors":{"title":"..."}}` — rejected; harder to display
  multiple errors per field.

---

## Decision 5: Angular State Management

**Decision**: A single `TodoService` holds a `signal<Todo[]>` as the shared source
of truth. All components inject `TodoService` and read the signal via `computed()` or
direct signal access. Mutations (create, update, patch, delete) call service methods
that update the signal after a successful HTTP response.

**Rationale**: Chosen in clarification Q3. Idiomatic Angular 22 signals pattern;
no extra dependencies; entire API surface lives in one testable service class.

**Key patterns**:
- `todos = signal<Todo[]>([])` — private, exposed via `readonly todosSignal`
- `loadTodos()` — calls `GET /api/todos`, sets signal on success
- `createTodo(dto)` — calls `POST`, prepends result to signal
- `updateTodo(id, dto)` — calls `PUT`, replaces matching item in signal
- `patchTodo(id, completed)` — calls `PATCH`, updates completed flag in signal
- `deleteTodo(id)` — calls `DELETE`, filters item from signal
- Error state: a separate `error = signal<string | null>(null)` on the service;
  components display it via `effect()` or direct template binding
- Loading state: a `loading = signal(false)` toggled around each HTTP call

**Alternatives considered**:
- NgRx SignalStore — rejected in clarification Q3; over-engineered for a single-user
  personal task list.
- Per-component API fetching — rejected; leads to inconsistent state across components.

---

## Decision 6: Bean Validation Strategy

**Decision**: Use Jakarta Bean Validation annotations (`@NotBlank`, `@Size`) on
record DTOs, triggered by `@Valid` on `@RequestBody` parameters in the controller.

**Implementation note**: Java records work with Bean Validation; annotate the record
component (constructor parameter), which also annotates the generated accessor method.
Spring Boot auto-configures the validator when `spring-boot-starter-validation` is
on the classpath.

**Patch DTO**: `PatchTodoRequest` has a single `Boolean completed` field annotated
`@NotNull` — the client must always supply a value (no partial-partial updates).

**Alternatives considered**:
- Manual validation in the service layer — rejected; Spring's built-in mechanism is
  simpler and produces standardised `BindingResult` that maps to FR-009's error shape.

---

## Decision 7: In-Memory Storage Implementation

**Decision**: `TodoService` is a Spring `@Service` holding
`ConcurrentHashMap<UUID, Todo>`. The `Todo` class is a standard Java class (not a
record) with mutable fields, since `updatedAt` must be updated in place.

**Key operations**:
- `findAll()` — returns all values sorted by `createdAt` descending
- `findById(UUID)` — `Optional<Todo>` from `map.get(id)`
- `create(dto)` — generates `UUID.randomUUID()`, sets `createdAt`/`updatedAt` to
  `Instant.now()`, stores and returns
- `update(id, dto)` — mutates existing Todo, updates `updatedAt`; throws if absent
- `patch(id, completed)` — mutates `completed` + `updatedAt`; throws if absent
- `delete(id)` — removes from map; throws if absent (→ 404)

**Alternatives considered**:
- `Todo` as a record — rejected; records are immutable, making in-place updates
  require replacing the entire map entry; simpler with a mutable class.
- `LinkedHashMap` — rejected; not thread-safe (irrelevant for single-user but
  ConcurrentHashMap is the spec mandate).
