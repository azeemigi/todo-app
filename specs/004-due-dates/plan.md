# Implementation Plan: Todo Due Dates

**Branch**: `004-due-dates` | **Date**: 2026-06-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-due-dates/spec.md`

## Summary

Add an optional `dueDate` (calendar date, no time) field to todos. Users set and clear due dates through the existing create and edit forms. Todo cards display the due date with "Overdue" / "Due today" urgency indicators (suppressed on completed todos). The filter panel gains "Overdue" and "Due this week" quick-filter buttons; the sort control gains two due-date sort options. Filtering and sorting are server-side; urgency classification is client-side at page-load time.

## Technical Context

**Language/Version**: Java 25 LTS (backend); TypeScript / Angular 22 (frontend)

**Primary Dependencies**: Spring Boot 3.5.14, Angular 22, Jackson Databind with JSR-310 module (auto-configured by Spring Boot), Angular standalone pipe for date formatting

**Storage**: `ConcurrentHashMap` (in-memory, unchanged) — `dueDate` added as `LocalDate` field on the `Todo` entity; no new data structures needed

**Testing**: JUnit 5 + Mockito (`@WebMvcTest` for controller, plain JUnit for service); Karma + Jasmine (Angular component and pipe tests)

**Target Platform**: JVM (Java 25), modern browser (ES2022+)

**Project Type**: Full-stack web application — Spring Boot JAR serving Angular SPA on port 8080

**Performance Goals**: No new targets; `nullsLast` comparator ensures due-date sort performs in O(n log n)

**Constraints**:
- Date-only — no time, no timezone — `LocalDate` on backend, `"yyyy-MM-dd"` ISO string on the wire, `string | null` in TypeScript
- Jackson `non_null` means a null `dueDate` is omitted from responses; client treats absent field as `null`
- Client-side overdue/due-today classification uses local date at page-load time (per spec assumption)

**Scale/Scope**: Incremental extension — one new field, one new enum, one new filter param, one new sort option, one new Angular pipe

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Test-First | **PASS** | Tasks generate failing tests before implementation code |
| II. Maven-Centric Build | **PASS** | No POM changes needed; `mvn clean verify` remains the gate |
| III. In-Memory Storage Only | **PASS** | `LocalDate dueDate` added to `ConcurrentHashMap`-stored `Todo`; no DB or file I/O |
| IV. REST API Contract | **PASS** | All endpoints remain under `/api/todos`; new params are additive; semantics unchanged |
| V. Angular Frontend Standards | **PASS** | OnPush, signals, standalone components, inject() maintained throughout |
| VI. Java Coding Standards | **PARTIAL** | Existing package `com.example.todoapi` deviates from `nz.co.todoapp` standard — pre-dates this feature; remediation is out of scope here |
| VII. Simplicity First | **PASS** | No new infrastructure; changes are additive; complexity is localised |

**Post-Phase 1 re-check**: All principles still pass. The `DueFilter` enum and `DueDatePipe` follow existing patterns; no deviation.

## Project Structure

### Documentation (this feature)

```text
specs/004-due-dates/
├── plan.md              # This file
├── research.md          # Phase 0 output — design decisions
├── data-model.md        # Phase 1 output — entity and DTO changes
├── contracts/
│   └── todos-api.md     # Phase 1 output — updated API contract
├── quickstart.md        # Phase 1 output — runnable validation scenarios
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
todo-api/src/main/java/com/example/todoapi/
├── model/
│   ├── Todo.java                    # + LocalDate dueDate (getter + setter)
│   ├── SortBy.java                  # + DUE_DATE("dueDate") constant
│   ├── DueFilter.java               # NEW: OVERDUE("overdue"), DUE_THIS_WEEK("due-this-week")
│   ├── TodoStatus.java              # unchanged
│   └── SortDir.java                 # unchanged
├── dto/
│   ├── CreateTodoRequest.java       # + LocalDate dueDate (optional, no validation)
│   ├── UpdateTodoRequest.java       # + LocalDate dueDate (optional, nullable)
│   ├── TodoResponse.java            # + String dueDate (ISO "yyyy-MM-dd" or omitted)
│   └── PatchTodoRequest.java        # unchanged
├── service/
│   └── TodoService.java             # findAll() + DueFilter param; create/update accept dueDate
├── controller/
│   └── TodoController.java          # getAllTodos() + optional dueFilter param; create/update pass dueDate
└── ...

todo-api/src/main/resources/
└── application.properties           # + spring.jackson.serialization.write-dates-as-timestamps=false

todo-api/src/test/java/com/example/todoapi/
├── service/
│   └── TodoServiceTest.java         # + dueDate in create/update; + DueFilter tests
└── controller/
    └── TodoControllerTest.java      # + dueFilter param; + dueDate in request/response

todo-ui/src/app/
├── core/
│   ├── models/
│   │   └── todo.model.ts            # Todo + dueDate; TodoFilter + dueFilter; DTOs + dueDate
│   └── services/
│       └── todo.service.ts          # findAll() passes dueFilter; create/update send dueDate
├── features/todo/
│   ├── todo-form/
│   │   ├── todo-form.component.ts   # FormControl<string> for dueDate
│   │   ├── todo-form.component.html # <input type="date"> field
│   │   └── todo-form.component.spec.ts  # + dueDate submit tests
│   ├── todo-edit/
│   │   ├── todo-edit.component.ts   # pre-populate dueDate from @Input todo
│   │   ├── todo-edit.component.html # <input type="date"> field
│   │   └── todo-edit.component.spec.ts  # + dueDate pre-populate and clear tests
│   ├── todo-item/
│   │   ├── todo-item.component.ts   # + computed dueStatus signal ('overdue'|'due-today'|'future'|'none')
│   │   ├── todo-item.component.html # + due date badge with SCSS classes
│   │   └── todo-item.component.spec.ts  # + dueStatus classification tests
│   ├── todo-list/
│   │   ├── todo-list.component.ts   # + dueFilter computed; VALID_SORT_BY includes 'dueDate'
│   │   └── todo-list.component.spec.ts  # + dueFilter URL sync tests
│   └── todo-list-controls/
│       ├── todo-list-controls.component.ts   # + dueFilter @Input/@Output; sort options for dueDate
│       ├── todo-list-controls.component.html # + due filter buttons; + sort options
│       └── todo-list-controls.component.spec.ts  # + due filter emission tests
└── shared/
    └── pipes/
        ├── due-date.pipe.ts          # NEW: formats "yyyy-MM-dd" → "Jun 15" / "Jun 15, 2027"
        └── due-date.pipe.spec.ts     # NEW: same-year, different-year, null input tests
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Package `com.example.todoapi` (deviates from `nz.co.todoapp` standard) | Pre-existing; all source files already use this package | Refactoring all packages would touch every Java file with no functional benefit and risk regressions unrelated to due dates |
