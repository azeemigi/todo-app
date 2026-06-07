# Implementation Plan: TODO REST API & Angular SPA

**Branch**: `001-todo-rest-spa` | **Date**: 2026-06-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-todo-rest-spa/spec.md`

## Summary

Full-stack TODO application: a Spring Boot 3.5.14 / Java 25 REST API backed by an
in-memory `ConcurrentHashMap`, served alongside an Angular 22 SPA from a single
Spring Boot process. The entire project is a Maven multi-module build — `mvn clean
verify` compiles both modules, runs JUnit 5 backend tests and Karma/Jasmine frontend
tests via `frontend-maven-plugin`, and copies the Angular dist output into the Spring
Boot static resources directory.

## Technical Context

**Language/Version**: Java 25 (backend), TypeScript 5.x / Node 24.16.0 (frontend)

**Primary Dependencies**:
- Backend: `spring-boot-starter-web`, `spring-boot-starter-validation`,
  `spring-boot-starter-test`
- Frontend: Angular 22 (standalone, signals, zoneless), HttpClient
- Build: `frontend-maven-plugin` (eirslett), `maven-resources-plugin`

**Storage**: In-memory — `ConcurrentHashMap<UUID, Todo>` inside a `@Service` bean;
no external database

**Testing**:
- Backend: JUnit 5 + Mockito (`spring-boot-starter-test` provides both)
- Frontend: Karma + Jasmine, executed via `frontend-maven-plugin` running
  `ng test --watch=false --browsers=ChromeHeadless`

**Target Platform**: JVM (Java 25) + modern evergreen browsers (Chrome, Firefox,
Safari, Edge — last 2 major versions)

**Project Type**: Maven multi-module web application (REST API + SPA)

**Performance Goals**: TODO list loads within 2 seconds for up to 100 items on
standard broadband; no explicit throughput targets (single-user, in-memory)

**Constraints**: Single-user; no auth; in-memory only; `mvn clean verify` must stay
green; Angular SPA routed via Spring Boot fallback to `index.html`

**Scale/Scope**: Personal task list; up to a few hundred TODOs; single JVM process

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Pre-Research | Post-Design |
|-----------|-------------|-------------|
| I. Test-First | ✅ JUnit 5 + Mockito for controller/service; Karma + Jasmine for Angular | ✅ Test files planned before implementation files in tasks |
| II. Maven-Centric Build | ✅ `frontend-maven-plugin` wires `ng build` + `ng test` into Maven lifecycle | ✅ Single `mvn clean verify` covers both modules |
| III. In-Memory Storage Only | ✅ `ConcurrentHashMap<UUID, Todo>`; no JPA/Hibernate | ✅ No persistence dependency anywhere in plan |
| IV. REST API Contract | ✅ GET, POST, PUT, PATCH, DELETE under `/api/todos` | ✅ Contract documented in `contracts/todos-api.md` |
| V. Angular Frontend Standards | ✅ Standalone components; `signal<Todo[]>` in `TodoService`; zoneless | ✅ No NgModules; no RxJS Subjects for state |
| VI. Java Coding Standards | ✅ Constructor injection; records for DTOs; Java 25; Spring Boot 3.5.14 | ✅ No Lombok; no field `@Autowired` |
| VII. Simplicity First | ✅ No Security/profiles/Docker/DB | ✅ No added dependencies beyond spec |

**Result**: All gates pass — no Complexity Tracking violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-rest-spa/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── todos-api.md     # Phase 1 output — HTTP API contract
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
todo-app/                              # Maven parent POM
├── pom.xml
├── todo-api/                          # Spring Boot backend module
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/example/todoapi/
│       │   │   ├── TodoApiApplication.java
│       │   │   ├── config/
│       │   │   │   └── SpaFallbackController.java  # serves index.html for SPA routes
│       │   │   ├── controller/
│       │   │   │   └── TodoController.java
│       │   │   ├── dto/
│       │   │   │   ├── CreateTodoRequest.java       # record
│       │   │   │   ├── UpdateTodoRequest.java       # record
│       │   │   │   ├── PatchTodoRequest.java        # record (completed flag only)
│       │   │   │   └── TodoResponse.java            # record
│       │   │   ├── exception/
│       │   │   │   ├── GlobalExceptionHandler.java  # @RestControllerAdvice
│       │   │   │   ├── ErrorResponse.java           # record {"errors":[...]}
│       │   │   │   └── FieldError.java              # record {"field","message"}
│       │   │   ├── model/
│       │   │   │   └── Todo.java                    # internal domain model
│       │   │   └── service/
│       │   │       └── TodoService.java
│       │   └── resources/
│       │       ├── application.properties
│       │       └── static/             # ← Angular dist copied here by maven-resources-plugin
│       └── test/
│           └── java/com/example/todoapi/
│               ├── controller/
│               │   └── TodoControllerTest.java
│               └── service/
│                   └── TodoServiceTest.java
└── todo-ui/                           # Angular frontend module
    ├── pom.xml                        # frontend-maven-plugin wired here
    ├── package.json
    ├── angular.json
    ├── proxy.conf.json                # proxies /api → localhost:8080 for ng serve
    └── src/
        ├── main.ts
        └── app/
            ├── app.component.ts
            ├── app.config.ts          # provideHttpClient, provideRouter
            ├── models/
            │   └── todo.model.ts      # Todo interface, CreateTodoDto, UpdateTodoDto
            ├── services/
            │   ├── todo.service.ts    # signal<Todo[]>, all API calls
            │   └── todo.service.spec.ts
            └── components/
                ├── todo-list/
                │   ├── todo-list.component.ts
                │   └── todo-list.component.spec.ts
                ├── todo-item/
                │   ├── todo-item.component.ts       # checkbox toggle, edit/delete actions
                │   └── todo-item.component.spec.ts
                ├── todo-form/
                │   ├── todo-form.component.ts       # create new TODO
                │   └── todo-form.component.spec.ts
                └── todo-edit/
                    ├── todo-edit.component.ts        # edit modal/inline
                    └── todo-edit.component.spec.ts
```

**Structure Decision**: Maven multi-module web application. Backend and frontend live
in sibling modules under the parent POM. Angular static output is copied into the
Spring Boot module's `resources/static/` directory at build time, enabling a single
runnable jar.

## Complexity Tracking

> No constitution violations — this table is intentionally empty.
