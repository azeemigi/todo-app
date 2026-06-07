# Skill: Git Workflow

**Scope:** All version control operations in the project
**Stack:** Git, GitHub (optional), Spec Kit branching conventions

---

## Branch Strategy

### Branch Naming

| Branch type | Pattern | Example |
|---|---|---|
| Main | `main` | `main` |
| Feature (Spec Kit) | `{NNN}-{feature-slug}` | `001-create-todo-app` |
| Feature (manual) | `feature/{short-description}` | `feature/add-todo-filtering` |
| Bug fix | `fix/{short-description}` | `fix/validation-error-format` |
| Chore | `chore/{short-description}` | `chore/upgrade-spring-boot` |

### Spec Kit Integration

Spec Kit detects the active feature from the Git branch name. When working on a spec-driven feature:

1. Create the branch matching the spec directory: `git checkout -b 001-create-todo-app`
2. Spec Kit commands (`/speckit.specify`, `/speckit.plan`, etc.) automatically associate with `specs/001-create-todo-app/`
3. When switching features, switch branches: `git checkout 002-add-filtering`

---

## Commit Message Convention

Use Conventional Commits format:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `test` | Adding or updating tests (no production code change) |
| `refactor` | Code restructuring without changing behaviour |
| `docs` | Documentation only |
| `chore` | Build, tooling, config, dependencies |
| `style` | Formatting, whitespace (no logic change) |

### Scopes

| Scope | What it covers |
|---|---|
| `api` | Backend Java code |
| `ui` | Angular frontend code |
| `build` | Maven POM, build config |
| `spec` | Spec Kit artefacts |

### Examples

```
feat(api): add CRUD endpoints for TODO resource

- GET/POST/PUT/DELETE /api/todos
- Bean validation on request DTOs
- Global exception handler for consistent error responses

feat(ui): add TODO list component with create form

fix(api): return 404 instead of 500 when TODO not found

test(api): add controller tests for validation edge cases

chore(build): configure frontend-maven-plugin for Angular build

docs: add API usage examples to README
```

### Rules

1. **Subject line**: imperative mood ("add", not "added" or "adds"), max 72 characters, no full stop at the end
2. **Body**: explain what and why, not how. Wrap at 72 characters
3. **One logical change per commit**: do not mix a feature with a refactor or a build change
4. **Never commit broken code**: `mvn clean verify` must pass before committing. If you must save work-in-progress, use `git stash`

---

## Git Hygiene (before starting work)

Run this checklist before starting any Medium or Large task:

```bash
# 1. Check current branch
git branch --show-current

# 2. Check for uncommitted changes
git status

# 3. If dirty, stash or commit before starting new work
git stash   # or commit

# 4. Pull latest (if working with a remote)
git pull --rebase origin main

# 5. Create a feature branch if starting new work
git checkout -b 001-create-todo-app
```

---

## Commit Frequency

- **Checkpoint commits**: after each independently verifiable slice of work passes `mvn clean verify`
- **Do NOT** accumulate large uncommitted changesets. If you have been working for more than 30 minutes without a commit, you are probably doing too much in one go
- **Atomic commits**: each commit should be a single logical unit that compiles, passes tests, and makes sense on its own

---

## What to Commit

### Always commit
- Source code (Java, TypeScript, HTML, SCSS)
- Test code
- Configuration (`pom.xml`, `angular.json`, `tsconfig.json`, `proxy.conf.json`)
- Documentation (`README.md`, `AGENT.md`, `CLAUDE.md`)
- Spec Kit artefacts (`.specify/`, `specs/`)
- Build scripts
- `.gitignore`

### Never commit
- `target/` (Maven build output)
- `node_modules/`
- `dist/` (Angular build output)
- `.angular/` (Angular cache)
- IDE files (`.idea/`, `.vscode/`, `*.iml`) -- unless the team agrees to share IDE config
- OS files (`.DS_Store`, `Thumbs.db`)
- Secrets, passwords, API keys (this project has none, but the rule stands)
- Downloaded Node/npm binaries from `frontend-maven-plugin`

---

## Reverting and Fixing

- **Amend the last commit** (before pushing): `git commit --amend`
- **Fix a broken commit**: create a new `fix` commit, do not rewrite history that has been pushed
- **Revert a commit**: `git revert <sha>` creates a new commit that undoes the change. Prefer this over `git reset` on shared branches

---

## Pull Request Checklist (when using GitHub)

Before opening a PR:

1. `mvn clean verify` passes
2. All new code has unit tests
3. Commit messages follow Conventional Commits format
4. Branch is up to date with `main`
5. PR description links to the spec/task being implemented
6. No unnecessary files committed (check `git diff --stat`)
