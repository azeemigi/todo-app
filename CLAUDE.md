# TODO App -- Claude Code Context

Read and follow AGENT.md for all agent behaviour, workflow, and coding standards.

<!-- SPECKIT START -->
## Active Feature

**Branch**: `002-todo-filtering-search-sort`
**Plan**: [specs/002-todo-filtering-search-sort/plan.md](specs/002-todo-filtering-search-sort/plan.md)
**Spec**: [specs/002-todo-filtering-search-sort/spec.md](specs/002-todo-filtering-search-sort/spec.md)
**Data Model**: [specs/002-todo-filtering-search-sort/data-model.md](specs/002-todo-filtering-search-sort/data-model.md)
**API Contract**: [specs/002-todo-filtering-search-sort/contracts/todos-api.md](specs/002-todo-filtering-search-sort/contracts/todos-api.md)
<!-- SPECKIT END -->

## Project overview

A full-stack TODO application built with spec-driven development using Spec Kit.

## Skill loading

- Custom project skills are defined in `.claude/skills/<skill-name>/SKILL.md`.
- Spec Kit workflows must apply both built-in `speckit-*` skills and these custom coding-standard skills when generating plans, tasks, and implementation changes.

## Tech stack

- **Frontend:** Angular 22 (standalone components, signals, zoneless)
- **Backend:** Java 25 LTS, Spring Boot 3.5.14, Maven
- **Build:** Maven multi-module (parent POM orchestrates both UI and API)
- **Storage:** In-memory (ConcurrentHashMap, no database)
- **Testing:** JUnit 5 + Mockito (backend), Karma + Jasmine (frontend)

## Project structure (target)
todo-app/                   # Maven parent POM
├── todo-api/               # Spring Boot backend module
│   └── src/
│       ├── main/java/      # REST controllers, services, models
│       └── test/java/      # JUnit 5 unit tests
├── todo-ui/                # Angular frontend module (built via frontend-maven-plugin)
│   ├── src/
│   └── pom.xml             # Uses frontend-maven-plugin for npm/ng commands
├── specs/                  # Spec Kit feature specs
├── .specify/               # Spec Kit internal
├── .claude/                # Claude Code commands
├── AGENT.md                # Agent workflow and standards
└── pom.xml                 # Parent POM

## Build commands

- `mvn clean verify` -- compile both modules, run all unit tests
- `mvn spring-boot:run -pl todo-api` -- start API on port 8080 (serves Angular static files too)
- `cd todo-ui && ng serve --proxy-config proxy.conf.json` -- Angular dev server with API proxy (dev mode)

## Conventions

- REST API base path: `/api/todos`
- Angular app is built to `todo-api/src/main/resources/static/` via Maven resources plugin
- Java source/target: 25
- No database -- use ConcurrentHashMap with UUID keys
- All endpoints return JSON
- Use constructor injection (no field injection)
- Use records for DTOs where appropriate

