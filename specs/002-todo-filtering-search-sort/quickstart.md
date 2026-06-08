# Quickstart: TODO Filtering, Search, and Sort Validation

**Feature**: `002-todo-filtering-search-sort`
**Date**: 2026-06-08

Use this guide to validate the feature end-to-end after implementation.

---

## Prerequisites

- `mvn clean verify` passes with all tests green
- Server running: `mvn spring-boot:run -pl todo-api` (API + Angular on port 8080)
- `jq` installed for readable JSON output (optional but recommended)

---

## Step 1: Seed Test Data

Create a set of TODOs with varied titles, descriptions, and completion states.

```bash
# Create active TODOs
curl -s -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Submit monthly report","description":"Finance team deadline"}' | jq .

curl -s -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Annual report review","description":"Board meeting prep"}' | jq .

curl -s -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Buy groceries","description":"Milk, eggs, bread"}' | jq .

# Create a completed TODO — save the ID from the response
ID=$(curl -s -X POST http://localhost:8080/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Archive old invoices","description":"Finance cleanup"}' | jq -r .id)

# Mark it completed
curl -s -X PATCH http://localhost:8080/api/todos/$ID \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}' | jq .
```

**Expected**: 4 TODOs total — 3 active, 1 completed.

---

## Step 2: Verify Backward Compatibility

```bash
curl -s http://localhost:8080/api/todos | jq 'length, .[0].title'
```

**Expected**: `4` and the most recently created TODO title (newest first).

---

## Step 3: Status Filter

```bash
# Active only
curl -s 'http://localhost:8080/api/todos?status=active' | jq 'length, [.[].completed]'
# Expected: 3, [false, false, false]

# Completed only
curl -s 'http://localhost:8080/api/todos?status=completed' | jq 'length, [.[].completed]'
# Expected: 1, [true]

# All (explicit)
curl -s 'http://localhost:8080/api/todos?status=all' | jq length
# Expected: 4
```

---

## Step 4: Text Search

```bash
# Search by title fragment
curl -s 'http://localhost:8080/api/todos?q=report' | jq '[.[].title]'
# Expected: ["Annual report review", "Submit monthly report"] (newest first)

# Case-insensitive
curl -s 'http://localhost:8080/api/todos?q=REPORT' | jq length
# Expected: 2

# Description search
curl -s 'http://localhost:8080/api/todos?q=Finance' | jq '[.[].title]'
# Expected: ["Archive old invoices", "Submit monthly report"]

# No match
curl -s 'http://localhost:8080/api/todos?q=xyzzy' | jq .
# Expected: []

# Whitespace-only query (treated as absent)
curl -s 'http://localhost:8080/api/todos?q=%20%20' | jq length
# Expected: 4 (all TODOs)
```

---

## Step 5: Sort Options

```bash
# Oldest first
curl -s 'http://localhost:8080/api/todos?sortBy=createdAt&sortDir=asc' | jq '[.[].title]'
# Expected: first-created TODO appears first

# Title A-Z
curl -s 'http://localhost:8080/api/todos?sortBy=title&sortDir=asc' | jq '[.[].title]'
# Expected: ["Annual report review", "Archive old invoices", "Buy groceries", "Submit monthly report"]

# Title Z-A
curl -s 'http://localhost:8080/api/todos?sortBy=title&sortDir=desc' | jq '[.[].title]'
# Expected: ["Submit monthly report", "Buy groceries", "Archive old invoices", "Annual report review"]
```

---

## Step 6: Combined Params

```bash
# Active TODOs containing "report", sorted A-Z by title
curl -s 'http://localhost:8080/api/todos?status=active&q=report&sortBy=title&sortDir=asc' | jq '[.[].title]'
# Expected: ["Annual report review", "Submit monthly report"]

# Completed TODOs containing "finance" (case-insensitive, description match)
curl -s 'http://localhost:8080/api/todos?status=completed&q=finance' | jq length
# Expected: 1
```

---

## Step 7: Invalid Parameter Validation

```bash
# Invalid status value
curl -s 'http://localhost:8080/api/todos?status=banana' | jq .
# Expected: HTTP 400
# {"errors":[{"field":"status","message":"..."}]}

# Invalid sortBy value
curl -s 'http://localhost:8080/api/todos?sortBy=priority' | jq .
# Expected: HTTP 400

# Invalid sortDir value
curl -s 'http://localhost:8080/api/todos?sortDir=sideways' | jq .
# Expected: HTTP 400

# Multiple invalid values — all reported in one response
curl -s 'http://localhost:8080/api/todos?sortBy=priority&sortDir=sideways' | jq '.errors | length'
# Expected: 2 errors in the response
```

---

## Step 8: Angular Frontend Validation

Open `http://localhost:8080` in a browser and verify:

1. **Status filter controls** are visible (All / Active / Completed). Clicking each updates the list and the URL (`?status=active` etc.).
2. **Search input** — typing `report` narrows the list to matching TODOs; clearing the input restores the full filtered set.
3. **Sort selector** — selecting Title A-Z reorders the list and updates `?sortBy=title&sortDir=asc` in the URL.
4. **URL persistence** — set `?status=active&q=report&sortBy=title&sortDir=asc`, reload the page; controls are pre-populated and the list is identical.
5. **Browser back/forward** — change filters, press Back; the previous filter state and list are restored.
6. **Empty state** — search for `xyzzy`; a contextual "no results" message appears.
7. **Loading indicator** — observe a loading indicator on the list area when controls change (visible on slower connections; use DevTools Network throttling if needed).
8. **Invalid URL params** — navigate to `http://localhost:8080/?status=banana`; no error is shown, the app defaults to All.
9. **CRUD while filters active** — with `?status=active` applied, create a new TODO; the new item appears in the active list. Delete a TODO; the list refreshes with the active filter still applied.

---

## Step 9: Rapid Control Changes (Stale Response Safety)

1. Open DevTools Network panel.
2. Throttle to "Slow 3G".
3. Type quickly in the search box (e.g., `r`, then `re`, then `rep`, then `repo`, then `repor`, then `report`).
4. Wait for all requests to complete.
5. **Expected**: The displayed list matches only the results for `report` (the last-submitted query). No earlier partial-match results overwrite the final state.

---

## Step 10: Run All Tests

```bash
mvn clean verify
```

**Expected**: BUILD SUCCESS — all new and existing tests pass.
