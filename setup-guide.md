# TODO App -- Spec Kit Setup Guide

**Stack:** Angular 22 | Java 25 LTS | Spring Boot 3.5.14 | Maven | Claude Code (Opus 4.6)

---

## Important Notes Before You Start

- **Spring Boot 3.5.x OSS support ends 30 June 2026.** This is fine for a learning/demo project. For production work, consider Spring Boot 4.0.x.
- **Angular 22** just shipped (June 2026). You already have CLI 22.0.0 installed. Confirm with `ng version`.
- **Maven is running Java 26** (`mvn -version` shows 26.0.1) but you want **Java 25** for the project. You'll configure this via `JAVA_HOME` or the Maven Toolchains plugin.

---

## Phase 1: Environment Preparation

### 1.1 Confirm your tools

```bash
java -version          # Should show 25.0.3+9-LTS-195
mvn -version           # 3.9.16 (Java 26 is fine as Maven runtime)
node -v                # v24.16.0
npm -v                 # 11.13.0
ng version             # Angular CLI 22.0.0
specify version        # Should show 0.8.x (latest is 0.8.18)
claude --version       # Claude Code CLI
```

### 1.2 Upgrade Spec Kit to latest (if needed)

```bash
uv tool install specify-cli --force --from git+https://github.com/github/spec-kit.git@v0.8.18
specify version
```

### 1.3 Set JAVA_HOME to Java 25 for the project

Find your Java 25 installation path:

```bash
/usr/libexec/java_home -V    # Lists all installed JDKs on macOS
```

Set it for your shell session (or add to your shell profile):

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 25)
java -version                # Verify it shows 25.0.3
```

---

## Phase 2: Project Scaffolding

### 2.1 Create the project directory

```bash
mkdir todo-app
cd todo-app
git init
```

### 2.2 Initialise Spec Kit with Claude Code integration

```bash
specify init --here --integration claude
```

This creates:
- `.claude/commands/` -- Spec Kit slash commands (speckit.specify, speckit.plan, etc.)
- `.specify/` -- Spec Kit project structure, scripts, and templates
- `.specify/memory/constitution.md` -- your project constitution (populated next)

### 2.3 Verify Spec Kit setup

```bash
ls -la .claude/commands/
ls -la .specify/
```

You should see files like `speckit.specify.md`, `speckit.plan.md`, `speckit.tasks.md`, etc. under `.claude/commands/`.

### 2.4 Create the AGENT.md

Copy the `AGENT.md` file (provided separately) into the project root:

```bash
cp /path/to/AGENT.md ./AGENT.md
```

### 2.5 Create a CLAUDE.md for project-level context

Create `CLAUDE.md` in the project root. This is what Claude Code reads on startup:

```bash
cat > CLAUDE.md << 'CLEOF'
# TODO App -- Claude Code Context

Read and follow AGENT.md for all agent behaviour, workflow, and coding standards.

## Project overview

A full-stack TODO application built with spec-driven development using Spec Kit.

## Tech stack

- **Frontend:** Angular 22 (standalone components, signals, zoneless)
- **Backend:** Java 25 LTS, Spring Boot 3.5.14, Maven
- **Build:** Maven multi-module (parent POM orchestrates both UI and API)
- **Storage:** In-memory (ConcurrentHashMap, no database)
- **Testing:** JUnit 5 + Mockito (backend), Karma + Jasmine (frontend)

## Project structure (target)

```
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
```

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
CLEOF
```

### 2.6 Create a .gitignore

```bash
cat > .gitignore << 'GIEOF'
# Java / Maven
target/
*.class
*.jar
*.war
.mvn/wrapper/maven-wrapper.jar

# Angular / Node
todo-ui/node_modules/
todo-ui/dist/
todo-ui/.angular/

# IDE
.idea/
*.iml
.vscode/
.project
.classpath
.settings/

# OS
.DS_Store
Thumbs.db

# Spec Kit working files
.specify/cache/
GIEOF
```

### 2.7 Initial commit

```bash
git add -A
git commit -m "chore: initialise project with Spec Kit, AGENT.md, and CLAUDE.md"
```

---

## Phase 3: Spec-Driven Development Workflow (in Claude Code)

Open the project in Claude Code:

```bash
cd todo-app
claude
```

### Step 1: Define the Constitution

In Claude Code's chat, run:

```
/speckit.constitution

This is a full-stack TODO application for learning spec-driven development.

Non-negotiable principles:
- Test-first: write unit tests before production code.
- Maven-centric build: `mvn clean verify` must compile both frontend and backend and run all tests green.
- No database: all data lives in memory (ConcurrentHashMap). Data loss on restart is acceptable.
- REST API contract: all endpoints under /api/todos, standard HTTP methods, JSON payloads.
- Angular standalone components with signals where appropriate.
- Constructor injection only (no @Autowired on fields).
- Records for immutable DTOs.
- Keep it simple: no Spring Security, no profiles, no Docker for now.
```

### Step 2: Create the Specification

```
/speckit.specify

Build a TODO application with a REST API backend and an Angular single-page frontend.

A TODO has: id (UUID, server-generated), title (required, 1-200 chars), description (optional, max 1000 chars), completed (boolean, default false), createdAt (server-generated timestamp), updatedAt (server-generated timestamp).

The API must support:
- GET /api/todos -- list all TODOs, newest first
- GET /api/todos/{id} -- get a single TODO by id (404 if not found)
- POST /api/todos -- create a new TODO (accepts title and description)
- PUT /api/todos/{id} -- update an existing TODO (title, description, completed)
- DELETE /api/todos/{id} -- delete a TODO (204 on success, 404 if not found)
- Input validation with proper error responses (400 with field-level messages)

The Angular frontend must:
- Display all TODOs in a list/card layout
- Show a form to create a new TODO
- Allow marking a TODO as complete/incomplete via checkbox
- Allow editing a TODO inline or in a modal
- Allow deleting a TODO with confirmation
- Show loading and error states
- Be responsive (works on mobile and desktop)

The build must:
- Compile via `mvn clean verify` which builds Angular, copies output to Spring Boot static resources, compiles Java, and runs all tests
- Run via `mvn spring-boot:run -pl todo-api` which serves both API and the built Angular app on port 8080
```

### Step 3: Clarify and Refine

```
/speckit.clarify

Focus on: API error handling contract, Angular state management approach, and the Maven build lifecycle for the dual-module setup.
```

### Step 4: Generate the Technical Plan

```
/speckit.plan

Technical decisions:
- Maven multi-module project: parent POM with two child modules (todo-api, todo-ui)
- todo-api: Spring Boot 3.5.14, Java 25, spring-boot-starter-web, spring-boot-starter-validation, spring-boot-starter-test
- todo-ui: Angular 22 standalone app, built via frontend-maven-plugin (node v24.16.0, npm 11.13.0)
- frontend-maven-plugin runs: npm install, ng build, ng test --watch=false --browsers=ChromeHeadless
- maven-resources-plugin copies todo-ui/dist/ output into todo-api/src/main/resources/static/
- In-memory storage: @Service with ConcurrentHashMap<UUID, Todo>
- Bean validation on request DTOs (@NotBlank, @Size, etc.)
- Global exception handler (@RestControllerAdvice) for consistent error responses
- Unit tests: JUnit 5 + Mockito for controller and service layers
- Frontend tests: Karma + Jasmine (Angular default), run via frontend-maven-plugin
```

### Step 5: Generate Tasks

```
/speckit.tasks
```

### Step 6: Validate (optional but recommended)

```
/speckit.analyze
```

### Step 7: Implement

```
/speckit.implement
```

---

## Phase 4: Verification (Post-Implementation)

After Claude Code finishes implementation, verify everything works:

```bash
# Set Java 25
export JAVA_HOME=$(/usr/libexec/java_home -v 25)

# Full build with tests
mvn clean verify

# Run the application
mvn spring-boot:run -pl todo-api

# Open in browser
open http://localhost:8080
```

Test the API directly:

```bash
# Create a TODO
curl -X POST http://localhost:8080/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Spec Kit","description":"Build a TODO app with SDD"}'

# List all TODOs
curl http://localhost:8080/api/todos

# Update a TODO (replace {id} with actual UUID from create response)
curl -X PUT http://localhost:8080/api/todos/{id} \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Spec Kit","description":"Done!","completed":true}'

# Delete a TODO
curl -X DELETE http://localhost:8080/api/todos/{id}
```

---

## Quick Reference: Key Maven Commands

| Command | What it does |
|---|---|
| `mvn clean verify` | Full build: compile UI + API, run all tests |
| `mvn clean verify -pl todo-api` | Build and test backend only |
| `mvn clean verify -pl todo-ui` | Build and test frontend only |
| `mvn spring-boot:run -pl todo-api` | Start the app (API + static UI) on port 8080 |
| `mvn clean install` | Build + install artifacts to local .m2 |

## Quick Reference: Spec Kit Commands (in Claude Code)

| Command | Purpose |
|---|---|
| `/speckit.constitution` | Define project principles |
| `/speckit.specify` | Write the feature specification |
| `/speckit.clarify` | Resolve ambiguities in the spec |
| `/speckit.checklist` | Validate spec quality |
| `/speckit.plan` | Create technical implementation plan |
| `/speckit.tasks` | Break plan into actionable tasks |
| `/speckit.analyze` | Audit consistency across spec/plan/tasks |
| `/speckit.implement` | Execute tasks and build the feature |
