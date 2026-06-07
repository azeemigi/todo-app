# Quickstart & Validation Guide: TODO REST API & Angular SPA

**Branch**: `001-todo-rest-spa` | **Date**: 2026-06-07

This guide describes how to build, run, and manually validate the application end-to-end.
See [contracts/todos-api.md](contracts/todos-api.md) for the full API reference and
[data-model.md](data-model.md) for data shapes.

---

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| JDK | 25+ | `java -version` |
| Maven | 3.9+ | `mvn -version` |
| Chrome / Chromium | Latest | Required for Karma `ChromeHeadless` during `mvn verify` |
| Node / npm | Managed by plugin | No manual installation needed — `frontend-maven-plugin` downloads Node 24.16.0 |

> Chrome must be discoverable on `$PATH` (or via `CHROME_BIN` env var) for the
> Angular tests to run inside Maven.

---

## Build (full: backend + frontend + all tests)

```bash
mvn clean verify
```

Expected outcome:
- `todo-ui` module: `npm install` → `ng build` → `ng test --watch=false --browsers=ChromeHeadless` (all Karma tests pass)
- `todo-api` module: Angular dist copied to `static/` → Java compiled → JUnit 5 tests pass
- Build ends with `BUILD SUCCESS`

---

## Run

```bash
mvn spring-boot:run -pl todo-api
```

The application starts on port 8080. Both the REST API and the Angular SPA are served
from the same process.

- API base: `http://localhost:8080/api/todos`
- SPA root: `http://localhost:8080`

---

## Development Mode (hot-reload)

Start the API first:
```bash
mvn spring-boot:run -pl todo-api
```

In a second terminal, start the Angular dev server with API proxy:
```bash
cd todo-ui
ng serve --proxy-config proxy.conf.json
```

Angular app: `http://localhost:4200` (proxies `/api/**` to `localhost:8080`)

---

## Validation Scenarios

Run these scenarios in order after starting the application. Each maps to a user story
in [spec.md](spec.md).

### Scenario 1 — Empty State (US1)

1. Open `http://localhost:8080` in a browser.
2. **Expected**: Empty-state message is displayed (e.g., "No TODOs yet — create one!").
3. No loading error, no console errors.

### Scenario 2 — Create a TODO (US2)

1. Fill in the create form with title `"Buy groceries"` and description `"Milk, eggs"`.
2. Submit the form.
3. **Expected**: New TODO appears at the top of the list immediately; form is reset.
4. Verify via API: `curl http://localhost:8080/api/todos` — response includes the new item.

### Scenario 3 — Validation Errors (US2)

1. Submit the create form with an empty title.
2. **Expected**: Field-level validation error shown beside the title input; no network request made.
3. Submit with a title of 201+ characters.
4. **Expected**: Validation error shown; no network request made.

### Scenario 4 — Toggle Completion (US3)

1. With at least one TODO in the list, click its checkbox.
2. **Expected**: Checkbox state changes; card visual style updates (e.g., strikethrough).
3. Click the checkbox again.
4. **Expected**: Reverts to incomplete style.
5. Reload the page — **Expected**: toggle state persists (survives a page reload, i.e., API state is correct).

> Note: Data is in-memory; state persists only until the server restarts.

### Scenario 5 — Edit a TODO (US4)

1. Click the edit action on an existing TODO.
2. **Expected**: Edit form appears pre-populated with current title and description.
3. Change the title to `"Buy groceries and cook dinner"` and save.
4. **Expected**: Updated title shown in the list immediately; edit form closes.
5. Open edit form again and cancel.
6. **Expected**: Form closes; title unchanged.

### Scenario 6 — Delete a TODO (US5)

1. Click the delete action on a TODO.
2. **Expected**: Confirmation prompt appears before deletion.
3. Cancel the confirmation.
4. **Expected**: TODO remains in the list.
5. Click delete again, then confirm.
6. **Expected**: TODO removed from the list immediately.

### Scenario 7 — API Error Handling

Simulate a 404:
```bash
curl -i http://localhost:8080/api/todos/00000000-0000-0000-0000-000000000000
```
**Expected**: HTTP 404 with body `{"errors":[{"field":"id","message":"TODO not found"}]}`

Simulate a 400:
```bash
curl -i -X POST http://localhost:8080/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title":""}'
```
**Expected**: HTTP 400 with body `{"errors":[{"field":"title","message":"must not be blank"}]}`

### Scenario 8 — Mobile Responsiveness (US1, US2)

1. Open browser DevTools and switch to a 375px-wide mobile viewport.
2. Load `http://localhost:8080`.
3. **Expected**: All TODO cards and the create form are readable and usable; no
   horizontal scrollbar.

### Scenario 9 — SPA Route Fallback

1. With at least one TODO, note its `id` from the list.
2. Navigate directly to `http://localhost:8080/anything-angular-managed` in the
   browser address bar.
3. **Expected**: Angular app loads (not a 404 page); the Angular router handles the path.

---

## Smoke Tests via curl

```bash
BASE=http://localhost:8080/api/todos

# Create
curl -s -X POST $BASE \
  -H "Content-Type: application/json" \
  -d '{"title":"Test TODO","description":"A description"}' | jq .

# List (should include the new item)
curl -s $BASE | jq .

# Capture the id from the list
ID=$(curl -s $BASE | jq -r '.[0].id')

# Get by id
curl -s $BASE/$ID | jq .

# Update (PUT)
curl -s -X PUT $BASE/$ID \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated TODO","description":null,"completed":false}' | jq .

# Toggle completion (PATCH)
curl -s -X PATCH $BASE/$ID \
  -H "Content-Type: application/json" \
  -d '{"completed":true}' | jq .

# Delete
curl -s -o /dev/null -w "%{http_code}" -X DELETE $BASE/$ID
# Expected: 204

# Confirm gone
curl -s -o /dev/null -w "%{http_code}" $BASE/$ID
# Expected: 404
```
