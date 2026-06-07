# Feature Specification: TODO Filtering, Search, and Sort

**Feature Branch**: `002-todo-filtering-search-sort`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "Add status filtering, text search, and sorting to the TODO list with URL-persisted view state."

## Clarifications

### Session 2026-06-07

- Q: Should filtering/sorting/search be done only in the frontend or supported by API query parameters too? → A: Support both UI controls and API query params on `GET /api/todos`.
- Q: What should happen when query parameters are invalid? → A: Return `400` with a validation error response for invalid enum values and invalid combinations.
- Q: Should URL query params persist list state for refresh/share/bookmark? → A: Yes, URL is the source of truth for filter/search/sort state in the frontend.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filter TODOs by Status (Priority: P1)

A user can switch between All, Active, and Completed views to focus on relevant tasks.

**Why this priority**: Status filtering is the highest-value enhancement for day-to-day task triage and should be available before other list controls.

**Independent Test**: Seed mixed TODOs, apply each status filter, and verify only matching items are displayed and returned by API.

**Acceptance Scenarios**:

1. **Given** TODOs with mixed completion states, **When** the user selects All, **Then** all TODOs are shown.
2. **Given** TODOs with mixed completion states, **When** the user selects Active, **Then** only incomplete TODOs are shown.
3. **Given** TODOs with mixed completion states, **When** the user selects Completed, **Then** only completed TODOs are shown.
4. **Given** no TODOs match the selected status, **When** the filtered list renders, **Then** an empty-state message is shown for that filter.
5. **Given** `status=completed` in URL query params, **When** the page loads, **Then** Completed is preselected and only completed TODOs are displayed.

---

### User Story 2 - Search TODOs by Text (Priority: P2)

A user can type text to find TODOs whose title or description contains the query.

**Why this priority**: Search significantly improves retrieval once users have more than a small number of TODOs.

**Independent Test**: Seed TODOs with known title/description terms, search with exact and partial text, and verify result set correctness.

**Acceptance Scenarios**:

1. **Given** TODOs containing "report" in title/description, **When** the user searches for `report`, **Then** only matching TODOs are shown.
2. **Given** TODO data with mixed case text, **When** the user searches with different case, **Then** matching is case-insensitive.
3. **Given** leading/trailing spaces in the search input, **When** search is applied, **Then** whitespace is trimmed before matching.
4. **Given** the search query is cleared, **When** the list refreshes, **Then** results return to the currently selected status/sort scope.
5. **Given** `q=invoice` in URL query params, **When** the page loads, **Then** the search input is prefilled and matching results are shown.

---

### User Story 3 - Sort TODOs (Priority: P3)

A user can sort TODOs by newest, oldest, title ascending, or title descending.

**Why this priority**: Sorting enables users to customize list order for recency or alphabetical scanning.

**Independent Test**: Seed TODOs with varied timestamps and titles, apply each sort option, and verify deterministic ordering.

**Acceptance Scenarios**:

1. **Given** TODOs with different creation timestamps, **When** sort is set to Newest, **Then** results are ordered by `createdAt` descending.
2. **Given** TODOs with different creation timestamps, **When** sort is set to Oldest, **Then** results are ordered by `createdAt` ascending.
3. **Given** TODOs with different titles, **When** sort is set to Title A-Z, **Then** results are ordered lexicographically ascending by title.
4. **Given** TODOs with different titles, **When** sort is set to Title Z-A, **Then** results are ordered lexicographically descending by title.
5. **Given** `sortBy=title&sortDir=asc` in URL query params, **When** the page loads, **Then** controls reflect that selection and list order matches.

---

### User Story 4 - Shareable View State via URL (Priority: P4)

A user can copy a URL and return to the same filter/search/sort view later.

**Why this priority**: Persisting view state improves usability and supports navigation consistency.

**Independent Test**: Configure controls, refresh the page, and open the URL in a new tab; state and results must be identical.

**Acceptance Scenarios**:

1. **Given** the user changes status, query, or sort, **When** controls update, **Then** URL query params are updated without full reload.
2. **Given** a URL containing status/query/sort params, **When** app initializes, **Then** UI controls and list results are hydrated from URL.
3. **Given** browser back/forward navigation, **When** query params change, **Then** list view updates to the navigated state.
4. **Given** malformed params in URL, **When** app parses state, **Then** unsupported values are replaced with defaults and user sees valid fallback state.

---

### Edge Cases

- `q` is empty or whitespace-only: treat as no search query.
- `status`, `sortBy`, or `sortDir` has an unsupported value: API returns 400; frontend falls back to defaults when hydrating URL state.
- Search text includes symbols or punctuation: should be treated as literal text (no regex semantics).
- Combined filters produce zero results: list shows contextual empty state, not generic error.
- Rapid changes to controls: latest selection wins; stale responses must not overwrite current list state.

## Requirements *(mandatory)*

### Functional Requirements

**API Contract**

- **FR-001**: The system MUST support optional query parameters on `GET /api/todos`: `status`, `q`, `sortBy`, `sortDir`.
- **FR-002**: `status` MUST support values `all`, `active`, `completed`; default is `all`.
- **FR-003**: `q` MUST perform case-insensitive substring matching across TODO title and description.
- **FR-004**: `sortBy` MUST support `createdAt` and `title`; default is `createdAt`.
- **FR-005**: `sortDir` MUST support `asc` and `desc`; default is `desc`.
- **FR-006**: Invalid enum-like query parameter values MUST return `400` with the existing validation error response shape.
- **FR-007**: Omitting all query params MUST preserve current behavior and return all TODOs newest-first.

**Frontend Behavior**

- **FR-008**: The UI MUST provide controls for status filter, search input, and sort selector.
- **FR-009**: Control state MUST be represented in URL query params and kept in sync on user changes.
- **FR-010**: On initial load, the app MUST restore controls and list results from URL query params.
- **FR-011**: Browser back/forward navigation MUST restore prior list state using URL-driven synchronization.
- **FR-012**: The list MUST update without full page reload when controls change.
- **FR-013**: Empty filtered/search results MUST render a contextual empty state.
- **FR-014**: Existing create/edit/toggle/delete flows MUST continue to work while filters/search/sort are active.

**Performance and Robustness**

- **FR-015**: The app MUST handle at least 500 in-memory TODO items without visible UI lag for filter/search/sort interactions under normal desktop conditions.
- **FR-016**: The backend MUST process list queries deterministically and avoid returning inconsistent ordering across identical requests.

### Key Entities

- **TodoQueryOptions**: Query options derived from URL/API params with fields `status`, `q`, `sortBy`, `sortDir`.
- **TodoListViewState**: Frontend state object reflecting current status filter, search text, sort field, and sort direction.
- **Validation Error Response**: Existing API error payload for invalid query input.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can narrow a list of 100+ TODOs to a target task in under 5 seconds using filter + search controls.
- **SC-002**: Refreshing a URL with query params reproduces the same view state and result ordering 100% of the time.
- **SC-003**: `GET /api/todos` remains backward-compatible when no query params are provided.
- **SC-004**: All new backend and frontend tests for filtering/search/sort pass in `mvn clean verify`.
- **SC-005**: Invalid query parameters consistently return `400` with field-level validation details.

## Assumptions

- The application remains single-user with in-memory storage.
- Search is basic substring matching; no stemming, fuzzy matching, or ranking.
- Pagination is still out of scope for this feature.
- URL query param persistence applies to list state only, not form draft inputs.
