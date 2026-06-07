<!--
SYNC IMPACT REPORT
==================
Version change: [unversioned template] → 1.0.0 (initial ratification)

Modified principles: N/A — initial population from template

Added sections:
  - I. Test-First (NON-NEGOTIABLE)
  - II. Maven-Centric Build
  - III. In-Memory Storage Only
  - IV. REST API Contract
  - V. Angular Frontend Standards
  - VI. Java Coding Standards
  - VII. Simplicity First
  - Tech Stack & Constraints
  - Development Workflow
  - Governance

Removed sections: N/A

Templates reviewed:
  ✅ .specify/templates/plan-template.md — Constitution Check section is
     dynamically derived from this file; no hardcoded principle references.
  ✅ .specify/templates/spec-template.md — No principle-specific references;
     test-first aligns with User Scenarios section being mandatory.
  ✅ .specify/templates/tasks-template.md — "Write tests FIRST, ensure they
     FAIL before implementation" already matches Principle I.
  ✅ .specify/templates/checklist-template.md — Reviewed; generic; no conflicts.

Follow-up TODOs: None — all placeholders resolved.
-->

# TODO App Constitution

## Core Principles

### I. Test-First (NON-NEGOTIABLE)

Unit tests MUST be written before production code is written. The Red-Green-Refactor
cycle is strictly enforced: write a failing test, confirm it fails, implement the
minimum code to make it pass, then refactor.

- Backend: JUnit 5 + Mockito; tests live in `todo-api/src/test/java/`
- Frontend: Karma + Jasmine; tests live alongside components in `todo-ui/src/`
- `mvn clean verify` MUST pass (all tests green) before any feature is considered
  complete

### II. Maven-Centric Build

The Maven multi-module build is the single source of truth for compilation, testing,
and packaging of the entire application.

- `mvn clean verify` MUST compile both the `todo-api` and `todo-ui` modules and run
  all unit tests without error
- The frontend-maven-plugin orchestrates npm/Angular CLI within the Maven lifecycle;
  no separate frontend build step is required for CI or releases
- Angular static assets are built to `todo-api/src/main/resources/static/` so the
  Spring Boot jar serves the full application on port 8080

### III. In-Memory Storage Only

All application data MUST reside in a `ConcurrentHashMap` keyed by `UUID`. No
database, ORM, or persistent file store of any kind is permitted.

- Data loss on server restart is acceptable and expected
- No Spring Data, JPA, Hibernate, JDBC, or file-system persistence
- IDs are generated with `UUID.randomUUID()` at creation time

### IV. REST API Contract

All HTTP endpoints MUST be mounted under `/api/todos` and conform to standard HTTP
semantics with JSON request/response bodies.

- `GET /api/todos` — list all todos
- `POST /api/todos` — create a todo
- `GET /api/todos/{id}` — retrieve a single todo
- `PUT /api/todos/{id}` — replace a todo
- `PATCH /api/todos/{id}` — partial update (e.g., toggle completion)
- `DELETE /api/todos/{id}` — delete a todo
- All responses MUST use `Content-Type: application/json`
- HTTP status codes MUST be semantically correct (200, 201, 204, 404, 400)

### V. Angular Frontend Standards

The Angular frontend MUST use the modern standalone component model with signals
where reactive state management is needed.

- All components MUST be standalone (`standalone: true`); no NgModules
- Reactive state MUST use Angular signals (`signal()`, `computed()`, `effect()`)
  rather than RxJS Subject/BehaviorSubject for local component state
- The app is zoneless (no Zone.js change detection)
- API calls go through a typed service; components do not call `fetch`/`HttpClient`
  directly

### VI. Java Coding Standards

All Java code MUST follow these non-negotiable conventions.

- Constructor injection ONLY — no `@Autowired` on fields or setters
- Immutable data transfer objects MUST be Java records
- Java source and target version: 25
- Spring Boot version: 3.5.14
- No Lombok; rely on records and IDE generation for boilerplate reduction

### VII. Simplicity First

The project MUST remain simple and free of infrastructure overhead.

- No Spring Security, Spring Profiles, or environment-specific configuration
- No Docker, container orchestration, or external services
- No database migrations, schema management, or Flyway/Liquibase
- When in doubt, choose the simpler implementation — complexity MUST be justified in
  the plan's Complexity Tracking table

## Tech Stack & Constraints

This section documents the fixed technology choices. Changes require a constitution
amendment.

| Layer      | Technology                                        |
|------------|---------------------------------------------------|
| Backend    | Java 25, Spring Boot 3.5.14, Maven                |
| Frontend   | Angular 22 (standalone, signals, zoneless)        |
| Build      | Maven multi-module with frontend-maven-plugin     |
| Storage    | ConcurrentHashMap (in-memory, no persistence)     |
| Testing    | JUnit 5 + Mockito (backend), Karma + Jasmine (FE) |
| Packaging  | Single Spring Boot jar serving Angular SPA        |

**Dev server shortcut**: `cd todo-ui && ng serve --proxy-config proxy.conf.json`
proxies `/api` to `localhost:8080` for hot-reload development.

## Development Workflow

1. Feature work begins with a feature branch created by `/speckit-git-feature`.
2. Spec is written first (`/speckit-specify`), clarified (`/speckit-clarify`),
   then planned (`/speckit-plan`) and broken into tasks (`/speckit-tasks`).
3. Before writing any production code, write the failing unit test first (Principle I).
4. Run `mvn clean verify` after each task to confirm the build stays green.
5. A feature is done only when `mvn clean verify` passes with all tests green and
   the acceptance scenarios from the spec are met.
6. Commit after each meaningful task; use `/speckit-git-commit` for consistent
   commit messages.

## Governance

This constitution supersedes all other coding guidelines, README instructions, and
verbal agreements. Any practice that contradicts a principle defined here MUST NOT
be merged.

**Amendment procedure**:
1. Open a spec (`/speckit-specify`) describing the proposed change and its rationale.
2. Update this file, increment the version per semantic versioning rules below, and
   set `Last Amended` to today's date.
3. Propagate changes to affected templates (see Sync Impact Report format above).
4. Commit with message: `docs: amend constitution to vX.Y.Z (<summary>)`

**Versioning policy**:
- MAJOR: Backward-incompatible governance change, principle removal, or redefinition
- MINOR: New principle or section added, or materially expanded guidance
- PATCH: Clarifications, wording fixes, non-semantic refinements

**Compliance**: Every implementation plan (`plan.md`) MUST include a Constitution
Check section that verifies each principle is satisfied before Phase 0 research
begins. Re-check after Phase 1 design. Violations MUST be recorded in the
Complexity Tracking table with justification.

**Version**: 1.0.0 | **Ratified**: 2026-06-07 | **Last Amended**: 2026-06-07
