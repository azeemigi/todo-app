# Quickstart Validation Guide: Todo Due Dates

**Feature**: `004-due-dates` | **Date**: 2026-06-08

This guide documents runnable scenarios to verify the due dates feature works end-to-end.

## Prerequisites

- `mvn clean verify` passes on the `004-due-dates` branch.
- Application is running: `mvn spring-boot:run -pl todo-api`
- App accessible at `http://localhost:8080`

---

## Scenario 1: Create todo with a due date

**Goal**: Verify FR-001, FR-002 — due date is optional; create form includes date field; due date is stored and returned.

```bash
# Create a todo with a due date
curl -s -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Buy groceries","dueDate":"2026-06-10"}' | jq .
```

**Expected**: Response includes `"dueDate": "2026-06-10"` and HTTP 201.

```bash
# Create a todo without a due date
curl -s -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Call dentist"}' | jq .
```

**Expected**: Response does NOT include a `dueDate` field (omitted by Jackson). HTTP 201.

---

## Scenario 2: Edit todo — set, change, and clear due date

**Goal**: Verify FR-003, FR-004 — edit form pre-populates due date; clearing removes it.

```bash
# Get ID of a todo with a due date (from Scenario 1)
ID=$(curl -s http://localhost:8080/api/todos | jq -r '.[0].id')

# Update to change the due date
curl -s -X PUT http://localhost:8080/api/todos/$ID \
  -H 'Content-Type: application/json' \
  -d '{"title":"Buy groceries","completed":false,"dueDate":"2026-06-20"}' | jq .dueDate
# Expected: "2026-06-20"

# Clear the due date (send null)
curl -s -X PUT http://localhost:8080/api/todos/$ID \
  -H 'Content-Type: application/json' \
  -d '{"title":"Buy groceries","completed":false,"dueDate":null}' | jq .
# Expected: no dueDate field in response
```

---

## Scenario 3: Due-date filtering — overdue

**Goal**: Verify FR-009, US3 acceptance scenario 1.

```bash
# Create an overdue todo (past date)
curl -s -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Overdue task","dueDate":"2026-01-01"}' | jq .id

# Create a future todo
curl -s -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Future task","dueDate":"2026-12-31"}' | jq .id

# Filter: only overdue
curl -s 'http://localhost:8080/api/todos?dueFilter=overdue' | jq '[.[] | .title]'
# Expected: ["Overdue task"] — future task not included
```

---

## Scenario 4: Due-date filtering — due this week

**Goal**: Verify FR-010, US3 acceptance scenario 2.

```bash
# Create a todo due in 3 days
curl -s -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Due soon","dueDate":"2026-06-11"}' | jq .id

# Create a todo due in 10 days
curl -s -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Due later","dueDate":"2026-06-18"}' | jq .id

# Filter: due this week (today = 2026-06-08, so due this week = 2026-06-08 to 2026-06-15)
curl -s 'http://localhost:8080/api/todos?dueFilter=due-this-week' | jq '[.[] | .title]'
# Expected: includes "Due soon" (Jun 11), NOT "Due later" (Jun 18)
```

---

## Scenario 5: Due-date sorting

**Goal**: Verify FR-012 — sort by dueDate; todos without due date sort to bottom.

```bash
# Create todos with various states
curl -s -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"No date task"}' > /dev/null

curl -s -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Far future","dueDate":"2026-12-31"}' > /dev/null

curl -s -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Near future","dueDate":"2026-06-15"}' > /dev/null

# Sort by dueDate ascending (soonest first)
curl -s 'http://localhost:8080/api/todos?sortBy=dueDate&sortDir=asc' | jq '[.[] | {title, dueDate}]'
# Expected: "Near future" first, "Far future" second, "No date task" last
```

---

## Scenario 6: Filter composition

**Goal**: Verify FR-011 — due-date filter composes with status filter.

```bash
# Mark an overdue todo as completed
OVERDUE_ID=$(curl -s 'http://localhost:8080/api/todos?dueFilter=overdue' | jq -r '.[0].id')
curl -s -X PATCH http://localhost:8080/api/todos/$OVERDUE_ID \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}' | jq .completed
# Expected: true

# Now filter overdue — completed todo should NOT appear (FR-009)
curl -s 'http://localhost:8080/api/todos?dueFilter=overdue' | jq 'length'
# Expected: 0 (the only overdue todo is now completed)

# Combine active status + overdue (should also return 0)
curl -s 'http://localhost:8080/api/todos?status=active&dueFilter=overdue' | jq 'length'
# Expected: 0
```

---

## Scenario 7: Invalid filter param

**Goal**: Verify server-side validation of new parameters.

```bash
curl -s 'http://localhost:8080/api/todos?dueFilter=banana' | jq .
# Expected: HTTP 400, fieldErrors.dueFilter contains "Invalid value 'banana'"

curl -s 'http://localhost:8080/api/todos?sortBy=invalid' | jq .
# Expected: HTTP 400, fieldErrors.sortBy contains "Invalid value 'invalid'"
```

---

## UI Validation Checklist

After starting the app at `http://localhost:8080`:

- [ ] **Create form**: date input field is present and optional; creating without a date succeeds
- [ ] **Create form**: creating with a date shows the date on the todo card
- [ ] **Todo card (overdue)**: red/warning "Overdue" badge visible on past-date, incomplete todo
- [ ] **Todo card (due today)**: "Due today" badge visible on today-dated, incomplete todo
- [ ] **Todo card (future)**: date shown as "Jun 15" (or "Jun 15, 2027" for next year), no urgency badge
- [ ] **Todo card (completed with overdue date)**: no urgency badge shown
- [ ] **Edit form**: date field pre-populated with existing due date
- [ ] **Edit form**: clearing the date and saving removes the date from the card
- [ ] **Filter controls**: "Overdue" and "Due this week" filter buttons present
- [ ] **Filter controls**: Applying "Overdue" filter shows only incomplete past-due todos
- [ ] **Filter controls**: Applying "Due this week" shows todos due within 7 days
- [ ] **Sort controls**: "Due date (soonest first)" and "Due date (latest first)" options present
- [ ] **Sort**: Todos without a due date appear at the bottom when sorting by due date
- [ ] **URL sync**: filter/sort state preserved in browser URL query params
