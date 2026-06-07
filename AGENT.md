# Agent workflow

Use this file for agent behaviour that is reusable across projects.

## Start-up behaviour

- If `.github/analysis/lessons.md` does not exist, create it by copying `.github/analysis/lessons.template.md` into it before proceeding. If the template does not exist either, create both with sensible defaults.
- Read `.github/analysis/lessons.md` before starting non-trivial work, and always when the user flags a repeat issue ("last time", "you missed"). It is the live log of corrections, pitfalls, and verified facts for this repository.
- Read `CLAUDE.md` for project-level context (tech stack, structure, conventions, build commands).
- When referring to custom plugin capabilities, prefer installed skill and agent names over source-folder paths; only mention repository paths when editing plugin source files.
- Treat missing files or missing skills as stale references to fix, not hidden conventions to guess.
- If `.github/verification/` does not exist, create it before starting a Medium or Large task. Copy `.github/verification/ledger.template.md` into `.github/verification/{task-id}.md` for each task.
- If `.github/decisions/` does not exist and a major architectural decision is needed, create it and start an ADR using the template at `.github/decisions/adr-template.md` (create the template if absent).

## Tech stack awareness

The agent must know and respect these constraints at all times:

- **Java 25 LTS** -- use language features up to Java 25 (records, sealed classes, pattern matching, virtual threads if appropriate). Do not use preview features.
- **Spring Boot 3.5.14** -- the final 3.5.x minor. Use `spring.io` as the primary documentation source. Do not reference Spring Boot 4.x APIs or conventions.
- **Angular 22** -- standalone components, signals, zoneless architecture. Use `angular.dev` as the primary documentation source.
- **Maven multi-module** -- parent POM orchestrates `todo-api` and `todo-ui`. Changes to build configuration must keep `mvn clean verify` green across both modules.
- **In-memory storage** -- `ConcurrentHashMap`. No JPA, no Hibernate, no database drivers.
- **No Spring Security** -- do not add authentication or authorization unless explicitly asked.
- **Constructor injection only** -- never use `@Autowired` on fields.
- **Records for DTOs** -- immutable data transfer objects.

## Pushback

Before executing any non-trivial request, evaluate whether it is a good idea at both the implementation and requirements level. If there is a problem, raise it and wait for confirmation before proceeding.

**Implementation concerns** -- flag when:
- The request will introduce tech debt, duplication, or unnecessary complexity.
- There is a simpler approach the user probably has not considered.
- The scope is too large or too vague to execute well in one pass.
- A proposed dependency conflicts with the existing stack (e.g. adding a database driver when storage is in-memory).
- A Maven change would break `mvn clean verify` or `mvn spring-boot:run -pl todo-api`.

**Requirements concerns** -- flag when:
- The feature conflicts with existing behaviour users depend on.
- The request addresses a symptom rather than the root cause (and you can identify the root cause from the codebase).
- Edge cases would produce surprising or dangerous behaviour for end users.
- The change makes an implicit assumption about system usage that may be wrong.
- A frontend change would break the build pipeline (Angular build copied to Spring Boot static resources).

Show a `⚠️ Pushback` callout explaining the concern and ask the user to choose: proceed as requested, adopt the suggested alternative, or rethink the approach. Do NOT implement until the user responds.

## Task sizing

Classify every task before starting work:

- **Small** (typo, rename, config tweak, one-liner) -- implement, run quick verification (build + basic checks), no ledger, no adversarial review. For Small source-code changes, also perform a lightweight spec validation check against the approved `spec.md`, story, or functional-requirements source; if no approved source is identifiable, ask which one authorises the change.
- **Medium** (bug fix, feature addition, focused refactor) -- full verification loop with verification ledger, `adversarial-code-reviewer` persona, `edge-case-hunter` persona for any code with branching logic or boundary conditions, `spec-drift-reviewer` whenever changed code must be traced to an approved `spec.md` or story.
- **Large** (new module, multi-file architecture, build pipeline changes) -- full verification loop with verification ledger, full persona-review panel, present plan and wait for user confirmation before implementing.

If unsure, treat as Medium.

> **Spec/plan sessions** (speckit.specify, speckit.clarify, speckit.plan, speckit.tasks
> and all speckit.bmad-review.* agents) are **exempt from persona-review and from the
> adversarial-code-reviewer**. Their review pipeline is built into the speckit prompts
> themselves.
>
> Persona-review applies to **code and planning artefacts**. Run `spec-drift-reviewer`
> whenever source code, `plan.md`, `tasks.md`, task-context slices, BDD/Gherkin
> specs, or test automation are created or materially updated as part of a
> spec/story/functional-requirement-driven change.
>
> For Small source-code changes, skip persona-review but still perform a lightweight
> spec validation check.

**Risk classification per file:**
- 🟢 Additive changes, new tests, documentation, config, comments.
- 🟡 Modifying existing business logic, changing function signatures, API contracts, Angular service/state logic.
- 🔴 Build pipeline (pom.xml, frontend-maven-plugin config), public API surface changes, data deletion logic, concurrency in the in-memory store.

## Working style

- For non-trivial work, plan before editing and then make small, testable changes.
- Prefer the simplest elegant solution that fits the existing design.
- Read code before changing it. Use explore subagents for unfamiliar areas.
- When stuck after 2 attempts, explain what failed and ask for help. Do not spin.
- Commit working increments. Do not accumulate large uncommitted changesets.

## The agent loop

Steps 0-3b produce minimal conversational output. Call tools and make progress silently. Exceptions: pushback callouts (if triggered), boosted prompt (if intent changed), and reuse opportunities (Step 2) are shown when they occur. Do not narrate the methodology -- follow it and show results.

### 0. Boost (silent unless intent changed)

Rewrite the user's prompt into a precise specification. Fix typos, infer target files/modules (use search/glob), expand shorthand into concrete criteria, add obvious implied constraints.

Only show the boosted prompt if it materially changed the intent:
```
> 📐 **Boosted prompt**: [your enhanced version]
```

### 0b. Git hygiene (silent -- Medium and Large only)

Check for uncommitted changes, verify you are on the correct branch, and ensure the working tree is clean before starting. Surface problems early.

### 1. Understand (silent)

Internally parse: goal, acceptance criteria, assumptions, open questions. If there are open questions, ask the user in the same session.

### 1b. Recall (silent -- Medium and Large only)

Before planning, check `.github/analysis/lessons.md` and any available session history for relevant context on the files you are about to change.

If a past lesson or session touched these files and had failures, mention it in your plan: "⚡ **History**: {source} encountered {issue} with this file."

### 2. Survey (silent, surface only reuse opportunities)

Search the codebase (at least 2 searches). Look for existing code that does something similar, existing patterns, test infrastructure, and blast radius.

If a materially similar in-repo pattern exists, treat it as the default approach. If you believe a new pattern is required, show a `⚠️ Pattern proposal` callout and wait for confirmation.

If you find reusable code, surface it:
```
> 🔍 **Found existing code**: [module/file] already handles [X]. Extending it: ~N lines. Writing new: ~M lines. Recommending the extension.
```

### 3. Plan (silent for Medium, shown for Large)

Internally plan which files change and their risk levels (🟢/🟡/🔴). For Large tasks, present the plan and wait for user confirmation before implementing.

### 3b. Baseline capture (silent -- Medium and Large only)

**🚫 GATE: Do NOT proceed to Step 4 until baseline entries are recorded in the verification ledger.**

Capture current build state before changing any code:

```bash
mvn clean verify    # Record: pass/fail, test counts
```

### 4. Implement

- **Write tests FIRST.** Create or update automated tests before writing production code. Only skip when the user explicitly waives test coverage.
  - Backend: JUnit 5 + Mockito. Test controllers with `@WebMvcTest`, test services with plain unit tests.
  - Frontend: Jasmine specs alongside each component/service. Run via `ng test --watch=false`.
- Follow existing codebase patterns. Read neighbouring code first.
- Apply the "Scoped changes discipline" -- touch only the files and functions needed for the task.
- Prefer modifying existing abstractions over creating new ones.
- Keep changes minimal and surgical.
- When the work naturally breaks into independently verifiable slices, create a checkpoint commit after the relevant verification is green and before starting the next risky slice.

**Build validation after every significant change:**

```bash
mvn clean verify    # Must pass before moving to the next slice
```

### 5. Verify

For Medium and Large tasks, run the full verification:

1. `mvn clean verify` -- all tests pass, both modules compile
2. `mvn spring-boot:run -pl todo-api` -- application starts, UI loads at localhost:8080
3. Quick smoke test of affected endpoints via curl
4. Record results in the verification ledger

For Small tasks: run `mvn clean verify`, confirm it passes, done. No ledger required.

If any check fails: fix and re-run. Do NOT leave the user with broken code silently.

### 6. Learn (after verification, before presenting)

For Medium and Large tasks, record confirmed facts and gotchas in `.github/analysis/lessons.md`. Examples:
- "frontend-maven-plugin requires explicit node/npm version in pom.xml"
- "Angular 22 standalone components do not need NgModule declarations"
- "ConcurrentHashMap.compute() is atomic for single-key updates"

### 7. Present

The user sees at most:
1. Pushback (if triggered)
2. Boosted prompt (only if intent changed)
3. Reuse opportunity (if found)
4. Plan (Large only)
5. Code changes -- concise summary
6. Evidence Bundle (Medium and Large): build output, test results, verification ledger
7. Uncertainty flags

For Small tasks: show the change, confirm `mvn clean verify` passed, done.

## Scoped changes discipline

When an agent modifies code, the changes must be limited to the scope of the current task.

- Do NOT simplify, refactor, or "improve" unrelated code, even if it would be more elegant or simpler.
- If you discover pre-existing issues in nearby code, note them in the verification ledger as deferred/pre-existing findings -- do not fix them as part of the current task unless the user explicitly asks.
- Keep the blast radius small: touch only the files and functions needed for the task.
- **Build pipeline rule**: any change to `pom.xml` (parent or child) must be verified with `mvn clean verify` immediately. A broken build blocks all other work.

## Skills

Skills are the project's authoritative coding standards. They live in `.claude/skills/` and must be read before writing any code in the relevant area.

| Skill file | Scope | Read before |
|---|---|---|
| `java-coding-standards.md` | All Java source in `todo-api/` | Writing any Java code |
| `angular-coding-standards.md` | All Angular source in `todo-ui/` | Writing any TypeScript, HTML, SCSS |
| `api-design.md` | REST endpoints, request/response contracts | Adding or changing any API endpoint |
| `logging-and-error-handling.md` | Exception handling, SLF4J logging, Angular error handling | Writing error handling, try/catch, logging, or HTTP error interceptors |
| `testing-standards.md` | JUnit 5, Mockito, @WebMvcTest, Jasmine, Karma | Writing any test code (backend or frontend) |
| `maven-build.md` | All pom.xml files, build lifecycle, frontend-maven-plugin | Touching any pom.xml or build configuration |
| `git-workflow.md` | Branch naming, commit messages, Git hygiene | Creating branches, writing commit messages |

### Skill compliance review

For every code change, identify which skills apply and verify compliance before presenting the work. The minimum set per change type:

- **Java backend code**: `java-coding-standards`, `logging-and-error-handling`, `testing-standards`
- **Angular frontend code**: `angular-coding-standards`, `logging-and-error-handling`, `testing-standards`
- **API endpoint changes**: `api-design`, `java-coding-standards`, `testing-standards`
- **Build/config changes**: `maven-build`
- **Any commit**: `git-workflow`

## Code generation standards

### General

- Read the applicable skills from `.claude/skills/` BEFORE writing code, not as a post-hoc check.
- Test-first is enforced in Step 4. Do not ship code-only changes without corresponding test coverage unless the user explicitly waives it.
- Keep code as simple as possible while meeting requirements; prefer straightforward designs over clever or deeply nested implementations.
- Add comments wherever the code is complex, non-obvious, or the logic is not self-explanatory.

### Java / Spring Boot

- **Constructor injection** -- never `@Autowired` on fields. Use `@RequiredArgsConstructor` (Lombok) or explicit constructors.
- **Records for DTOs** -- `CreateTodoRequest`, `UpdateTodoRequest`, `TodoResponse`, `ErrorResponse` should be Java records.
- **Bean Validation** -- `@NotBlank`, `@Size`, `@NotNull` on request DTOs. `@Valid` on controller parameters.
- **`@RestControllerAdvice`** -- single global exception handler for validation errors (400), not-found (404), and unexpected errors (500).
- **Logging** -- use SLF4J (`@Slf4j` or manual `LoggerFactory`). Log at appropriate levels: DEBUG for flow, INFO for state changes, WARN for recoverable issues, ERROR for failures with stack traces.
- **Exceptions must never be silently ignored.** Any caught exception must be handled explicitly and logged with stack trace context.
- **No `null` returns from service methods** -- use `Optional<T>` for lookups that might miss.

### Angular

- **Standalone components** -- no NgModules unless absolutely required by a third-party library.
- **Signals** for reactive state where appropriate.
- **HttpClient** in services, not in components directly.
- **Reactive forms** with validation for the create/edit form.
- **OnPush** change detection strategy on all components.
- **Environment-based API URL** -- use Angular's environment files or a proxy config for the API base URL.

### Maven

- **Parent POM** at project root defines shared properties, dependency management, and module list.
- **`todo-api` module** uses `spring-boot-starter-parent` as its parent (or imports the Spring Boot BOM via `dependencyManagement`).
- **`todo-ui` module** uses `frontend-maven-plugin` to install Node/npm and run Angular CLI commands.
- **Resource copy** -- `maven-resources-plugin` in `todo-api` copies the built Angular output from `todo-ui/dist/` into `todo-api/target/classes/static/` during the `generate-resources` or `process-resources` phase.
- **Test phase** -- `frontend-maven-plugin` runs `ng test --watch=false --browsers=ChromeHeadless` during Maven's `test` phase for the `todo-ui` module.

## Decision records

Record non-trivial decisions in the "Key Decisions" section of the verification ledger: what was decided, why, what alternatives were rejected, and what assumptions applied.

For major architectural choices (new pattern, technology selection, structural precedent), create an ADR at `.github/decisions/{NNNN}-{title}.md`.

## Interactive input rule

Never give the user a command requiring their interactive input -- the user cannot access agent terminal sessions and it will hang. Collect values via questions first, then pipe them into the command yourself. If a command genuinely requires the user's own environment (e.g. browser-based OAuth), tell them the exact command and why.

## Documentation lookup

Use the primary official documentation source:
- **Spring Boot**: `spring.io/projects/spring-boot`, `docs.spring.io`
- **Angular**: `angular.dev`
- **Java**: `docs.oracle.com`
- **Maven**: `maven.apache.org`

Do NOT use third-party aggregators (Baeldung, StackOverflow, tutorials) as primary sources. If official docs do not answer the question, say so and ask the user.

## Typical follow-through

- If public behaviour, configuration keys, or usage examples change, update `README.md`.
- Prefer unit tests for focused logic changes.
- After adding a new endpoint, verify with `curl` examples.
- After changing Angular components, verify the build with `ng build` or `mvn clean verify`.
- When creating or updating verification ledgers or ADRs, follow the templates and keep entries concise.
