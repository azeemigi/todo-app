# Verification Ledger: {task-id}

## Task Summary

- **Description**: {one-line description}
- **Size**: {Small / Medium / Large}
- **Risk**: {🟢 / 🟡 / 🔴}
- **Files changed**: {list}

## Baseline (captured before changes)

| Check | Result | Notes |
|---|---|---|
| `mvn clean verify` | {PASS/FAIL} | {test count, any warnings} |
| App starts (`mvn spring-boot:run -pl todo-api`) | {PASS/FAIL} | {port, any errors} |

## Changes Made

{Concise summary of what was changed and why}

## Verification Results (after changes)

| Check | Result | Notes |
|---|---|---|
| `mvn clean verify` | {PASS/FAIL} | {test count, any warnings} |
| Backend unit tests | {X passed, Y failed} | {details if failures} |
| Frontend unit tests | {X passed, Y failed} | {details if failures} |
| App starts | {PASS/FAIL} | {port, any errors} |
| Smoke test | {PASS/FAIL} | {endpoints tested} |

## Key Decisions

| Decision | Rationale | Alternatives rejected |
|---|---|---|

## Deferred / Pre-existing Findings

{Issues found in nearby code that are out of scope for this task}

## Lessons

{Any new lessons to add to `.github/analysis/lessons.md`}
