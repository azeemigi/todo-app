# Research: TODO Filtering, Search, and Sort

**Feature**: `002-todo-filtering-search-sort`
**Date**: 2026-06-08

---

## Decision 1: Spring Boot query parameter validation and 400 error shape

**Decision**: Use Java enums (`TodoStatus`, `SortBy`, `SortDir`) as `@RequestParam` types; handle `MethodArgumentTypeMismatchException` in `GlobalExceptionHandler`.

**Rationale**: When Spring MVC binds a `@RequestParam` to an enum type, an unrecognised string value automatically throws `MethodArgumentTypeMismatchException`. Adding a handler for this in the existing `GlobalExceptionHandler` maps the exception to the existing `{"errors":[{"field":"<param>","message":"<reason>"}]}` shape with zero duplication. Default values for absent params are declared with `@RequestParam(defaultValue = "...")` so omitting a param is not an error — only unrecognised values are rejected.

**Alternatives considered**:
- Manual string validation in the service layer: rejected because it pushes binding concerns into business logic and requires bespoke if/else blocks.
- `@Pattern` + Bean Validation on String params: rejected because it would return a `MethodArgumentNotValidException`, which the existing handler already covers for body validation; mixing two exception types for the same concept is confusing. Enum binding is cleaner.
- `@RequestParam(required = false) String status` + switch statement: rejected — equivalent to manual validation but without Spring's exception infrastructure.

---

## Decision 2: Angular stale request cancellation without RxJS restructuring

**Decision**: Use a monotonic **generation counter** in `TodoService`. Each `loadTodos()` call increments the counter and captures the value at call time; the `subscribe` callback ignores the response if the captured value no longer matches the current counter.

**Rationale**: The existing service uses imperative `HttpClient.get().subscribe()` calls rather than a reactive pipeline. Introducing `Subject` + `switchMap` would require restructuring the entire service and all its callers. The generation counter achieves the same correctness guarantee — latest response wins, stale responses are silently discarded — with no new RxJS operators and no changes to the service's public API signature.

**Alternatives considered**:
- `Subject` + `switchMap` reactive pipeline: provides automatic HTTP request cancellation (network-level abort), which saves bandwidth. Rejected because it requires a significant refactor of the existing service and introduces RxJS dependency in a signals-first architecture. Can be adopted in a later iteration.
- `AbortController` / `fetch` API: Angular `HttpClient` does not natively integrate `AbortController`; bridging it is more complex than the counter approach without meaningful additional benefit in a local-dev-only app.
- `takeUntilDestroyed()`: only cancels on component destroy, not on superseding requests — does not solve the stale response problem.

---

## Decision 3: Angular Router query params → signals bridge

**Decision**: Use `toSignal(this.route.queryParamMap, { initialValue: new Map() })` from `@angular/core/rxjs-interop` to convert the Router's `queryParamMap` Observable into a signal. Derive each filter param as a `computed()` signal. Update the URL via `router.navigate([], { queryParams: {...}, queryParamsHandling: 'merge' })`.

**Rationale**: `toSignal()` is the officially supported Angular 17+ bridge between RxJS Observables (which the Router API exposes) and the signals graph. Because `queryParamMap` emits on every navigation — including browser back/forward — the derived `computed()` signals automatically invalidate and trigger any dependent `effect()` when history navigation changes the URL. No manual subscription management or teardown is needed. `queryParamsHandling: 'merge'` ensures changing one control does not erase the others from the URL.

**Alternatives considered**:
- Subscribing to `queryParamMap` in `ngOnInit` and storing values in plain signals: correct but requires manual `takeUntilDestroyed()` cleanup and misses back/forward navigation events if the subscription is not re-established on navigation.
- Storing filter state in a standalone signal in the service (not in the URL): rejected — spec FR-010 mandates URL as the single source of truth.
- Using `@angular/router`'s `RouterLink` with `queryParams` binding only: insufficient because it doesn't handle programmatic control changes (e.g., typing in the search box).

---

## Decision 4: TodoListComponent architecture (URL ownership + controls)

**Decision**: `TodoListComponent` is the smart container that owns URL query param reading and navigation. A new `TodoListControlsComponent` (standalone, dumb) receives the current filter state as `@Input()` signals and emits changes via `@Output()` — it has no direct Router dependency.

**Rationale**: Separating the URL-aware container from the presentational controls makes each independently testable. `TodoListControlsComponent` tests need only mock `@Input()` values and assert `@Output()` events. `TodoListComponent` tests can test URL hydration and API triggering in isolation from control rendering. This matches the pattern used in feature 001 (smart `AppComponent` → dumb child components).

**Alternatives considered**:
- All logic in a single `TodoListComponent`: simpler file count but makes the component hard to unit-test in isolation (Router, HttpClient, and DOM interactions all in one test).
- Three separate components (filter, search, sort): over-engineered for three closely related controls that share the same URL-update mechanism.

---

## Decision 5: Backend filtering and sorting implementation location

**Decision**: Filtering, searching, and sorting are implemented in `TodoService.findAll(status, q, sortBy, sortDir)` using Java stream operations over the `ConcurrentHashMap` values. The controller passes validated enum params directly to the service.

**Rationale**: Business logic belongs in the service layer, not the controller. The in-memory store (ConcurrentHashMap) has no native query capability, so stream filtering is the only option. Streams are stateless, readable, and trivially testable.

**Alternatives considered**:
- Controller-level filtering: violates separation of concerns.
- A separate `TodoFilterService`: over-engineered for a single additional method signature; the existing `TodoService` is the natural owner of list retrieval logic.
