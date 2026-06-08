# Feature Specification: TODO Filtering, Search, and Sort

**Feature Branch**: `002-todo-filtering-search-sort`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "Add list controls for status filter (all, active, completed), text search across title and description, and sorting by createdAt (asc/desc) and title (asc/desc). Extend GET /api/todos with optional query params: status, q, sortBy, sortDir. Preserve backward compatibility so no params returns current newest-first behavior. Invalid query values must return 400 using the existing validation error shape. In Angular, make URL query params the source of truth so filter/search/sort state persists on refresh, deep links, and browser back/forward navigation. Include empty-state behavior for no matches and robust handling of rapid control changes so stale responses do not overwrite newer state."

## Clarifications

### Session 2026-06-07

- Q: Should filtering/sorting/search be done only in the frontend or supported by API query parameters too? → A: Support both UI controls and API query params on `GET /api/todos`.
- Q: What should happen when query parameters are invalid? → A: Return `400` with a validation error response for invalid enum values and invalid combinations.
- Q: Should URL query params persist list state for refresh/share/bookmark? → A: Yes, URL is the source of truth for filter/search/sort state in the frontend.

### Session 2026-06-08

- Q: How should stale API responses be handled when controls change rapidly? → A: Latest request wins; responses for superseded requests must be discarded and must not overwrite the current list state.
- Q: Should the UI display a loading state while a filter, search, or sort change is being fetched? → A: Yes — show a subtle loading indicator on the list area while the fetch is in-flight; controls remain interactive throughout.
- Q: After a CRUD operation completes while filter/search/sort controls are active, what should the list show? → A: Reload with current filter/search/sort params preserved — URL state is the source of truth and must not be reset by CRUD operations.
- Q: When a control-triggered API call fails (network error or server error), what should the UI display? → A: Show the existing error state in the list area (reuse the current error signal); the error message replaces the list and includes a retry action.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Filter TODOs by Status (Priority: P1)

A user can switch between All, Active, and Completed views to focus on relevant tasks. Selecting a status filter immediately narrows the list to only TODOs that match, with a clear empty-state message when no TODOs qualify.

**Why this priority**: Status filtering is the highest-value list control for daily task triage. It is independently useful before search or sort are added.

**Independent Test**: Seed a mix of completed and incomplete TODOs. Apply each status filter value in turn and verify only the correct subset is shown. Verify the empty-state renders when no TODOs match the filter.

**Acceptance Scenarios**:

1. **Given** TODOs with mixed completion states exist, **When** the user selects All, **Then** all TODOs are displayed regardless of completion state.
2. **Given** TODOs with mixed completion states exist, **When** the user selects Active, **Then** only incomplete TODOs are shown.
3. **Given** TODOs with mixed completion states exist, **When** the user selects Completed, **Then** only completed TODOs are shown.
4. **Given** no TODOs match the selected status, **When** the filtered list renders, **Then** a contextual empty-state message is shown (not a generic error).
5. **Given** `?status=completed` is in the URL, **When** the page loads, **Then** Completed is pre-selected in the filter control and only completed TODOs are shown.
6. **Given** `?status=banana` is in the URL, **When** the page loads, **Then** the UI silently falls back to All and a well-formed list is shown (invalid URL params are replaced with defaults by the frontend).

---

### User Story 2 — Search TODOs by Text (Priority: P2)

A user can type a search query to find TODOs whose title or description contains the text, with results updating as the user types.

**Why this priority**: Search becomes essential once users accumulate more than a handful of TODOs. It is independently valuable even without status filtering or sorting.

**Independent Test**: Seed TODOs with known terms in titles and descriptions. Search with partial, full, and mixed-case queries and verify that only matching TODOs are returned. Verify empty-state when nothing matches.

**Acceptance Scenarios**:

1. **Given** a TODO titled "Submit monthly report", **When** the user searches for `report`, **Then** that TODO appears in results.
2. **Given** a TODO titled "Submit Monthly Report", **When** the user searches for `monthly report`, **Then** matching is case-insensitive and the TODO is shown.
3. **Given** a TODO with description "Discuss budget with team", **When** the user searches for `budget`, **Then** the TODO is shown because description is also searched.
4. **Given** the user types `   ` (whitespace only) in the search box, **When** the search is applied, **Then** the query is treated as no filter (all TODOs under the current status filter are shown).
5. **Given** the search box is cleared, **When** the list updates, **Then** the display returns to all TODOs under the current status filter and sort.
6. **Given** no TODOs match the search text and active status filter, **When** the list renders, **Then** a contextual empty-state message describing the no-match condition is shown.
7. **Given** `?q=invoice` is in the URL, **When** the page loads, **Then** the search input is pre-filled with `invoice` and only matching TODOs are shown.

---

### User Story 3 — Sort TODOs (Priority: P3)

A user can sort the TODO list by creation date (newest or oldest first) or by title (A-Z or Z-A). The selected sort order persists across filter and search changes.

**Why this priority**: Sorting enables scanning by recency or alphabetically and complements the filter and search features. It has lower standalone value than filtering or search.

**Independent Test**: Seed TODOs with different timestamps and titles. Apply each sort combination and verify deterministic ordering. Combine with a status filter to confirm sort applies within the filtered set.

**Acceptance Scenarios**:

1. **Given** TODOs with different creation times, **When** sort is Newest (createdAt desc), **Then** the most recently created TODO appears first.
2. **Given** TODOs with different creation times, **When** sort is Oldest (createdAt asc), **Then** the oldest TODO appears first.
3. **Given** TODOs with different titles, **When** sort is Title A-Z (title asc), **Then** results are ordered lexicographically ascending.
4. **Given** TODOs with different titles, **When** sort is Title Z-A (title desc), **Then** results are ordered lexicographically descending.
5. **Given** an Active filter is applied, **When** sort is changed to Title A-Z, **Then** only active TODOs are shown and they are sorted A-Z.
6. **Given** `?sortBy=title&sortDir=asc` is in the URL, **When** the page loads, **Then** the sort control reflects A-Z and the list is ordered accordingly.

---

### User Story 4 — Shareable and Persistent View State (Priority: P4)

A user can copy a URL representing a specific filter, search, and sort configuration and return to exactly that view later — including after a page refresh, sharing the link with themselves in a new tab, or using browser back/forward navigation.

**Why this priority**: URL-persisted view state maximises the usefulness of the other three features by making them durable. It has a dependency on all three controls being implemented.

**Independent Test**: Set filter + search + sort controls, note the URL, reload the page, and confirm UI controls and list content are identical. Use browser Back and Forward and confirm view transitions correctly.

**Acceptance Scenarios**:

1. **Given** the user changes any control (status, search, sort), **When** the control updates, **Then** the URL query params update immediately without a full page reload.
2. **Given** a URL containing `?status=active&q=report&sortBy=title&sortDir=desc`, **When** the page loads, **Then** controls are hydrated from the URL and the list shows filtered, searched, and sorted results.
3. **Given** the user navigates away and presses browser Back, **When** the previous URL is restored, **Then** the list view reflects that prior state.
4. **Given** invalid values in URL params (e.g., `?status=foo&sortBy=bar`), **When** the app initialises, **Then** invalid params are replaced with defaults and a valid list is shown without errors.
5. **Given** a URL with only some params (e.g., `?status=active`), **When** the page loads, **Then** missing params use their defaults (all TODOs newest-first).

---

### User Story 5 — Stale Response Safety (Priority: P5)

When the user changes controls rapidly (e.g., types quickly in search), the list always reflects the most recent user intent. Responses from earlier superseded requests are silently discarded rather than overwriting the current display.

**Why this priority**: Without this guarantee, rapid changes produce a race condition where an older result can appear as the final state, which is both confusing and incorrect. This is a correctness requirement for all three controls.

**Independent Test**: Trigger multiple rapid control changes in quick succession and verify the final displayed list matches only the last-applied control state.

**Acceptance Scenarios**:

1. **Given** the user types three characters rapidly in the search box, **When** all three API calls complete in any order, **Then** the displayed list matches only the response for the third (most recent) search query.
2. **Given** a slow API response is in flight and the user changes the status filter, **When** the slow response arrives after the filter change response, **Then** the slow response is discarded and the current list is not overwritten.
3. **Given** the user switches from Completed to Active and back to Completed rapidly, **When** all responses arrive, **Then** the displayed list shows Completed TODOs.

---

### Edge Cases

- `q` is empty string or whitespace-only: treat as absent — apply no text filter.
- `status`, `sortBy`, or `sortDir` has an unsupported value sent to the **API**: return `400` with the existing field-level validation error shape (`{"errors":[{"field":"<param>","message":"<reason>"}]}`).
- `status`, `sortBy`, or `sortDir` has an unsupported value in the **URL query params**: frontend silently replaces with the default value (no `400` is surfaced to the user for URL params).
- Search text contains symbols or punctuation: treated as literal characters (no regex interpretation).
- Combined status filter + search produces zero results: show a contextual empty-state message, not a generic error.
- All TODOs are deleted while a filter is active: empty-state message is shown.
- `sortBy` provided without `sortDir` or vice versa: each defaults independently (`createdAt` / `desc`); no error.
- Concurrent CRUD operations (create/edit/delete) while filters are active: CRUD succeeds and the list refreshes applying the current filter/search/sort params (URL state is preserved).
- Network or server error during a control-triggered fetch: the list area transitions to the error state with a retry action; controls remain available so the user can adjust their query.

## Requirements *(mandatory)*

### Functional Requirements

**API Contract**

- **FR-001**: `GET /api/todos` MUST accept optional query parameters: `status`, `q`, `sortBy`, `sortDir`.
- **FR-002**: `status` MUST accept values `all`, `active`, `completed`; default when absent is `all`.
- **FR-003**: `q` MUST perform case-insensitive substring matching against TODO title and description; leading/trailing whitespace is trimmed; an empty or whitespace-only value is treated as absent.
- **FR-004**: `sortBy` MUST accept values `createdAt` and `title`; default when absent is `createdAt`.
- **FR-005**: `sortDir` MUST accept values `asc` and `desc`; default when absent is `desc`.
- **FR-006**: An unrecognised value for `status`, `sortBy`, or `sortDir` MUST return `400` with the existing validation error shape (`{"errors":[{"field":"<param>","message":"<reason>"}]}`).
- **FR-007**: Calling `GET /api/todos` with no query params MUST return all TODOs ordered by `createdAt` descending (identical to current behavior — full backward compatibility).
- **FR-008**: Filtering, searching, and sorting MUST compose: when multiple params are supplied, all are applied together in a single response.

**Frontend Behavior**

- **FR-009**: The UI MUST provide a status filter control (All / Active / Completed), a text search input, and a sort selector (Newest / Oldest / Title A-Z / Title Z-A).
- **FR-010**: URL query params (`status`, `q`, `sortBy`, `sortDir`) are the single source of truth for list view state; controls MUST read from and write to the URL.
- **FR-011**: On initial page load (including refresh and direct URL navigation), the app MUST hydrate all controls from URL query params before fetching.
- **FR-012**: Browser back/forward navigation MUST update controls and refetch the list to match the restored URL state.
- **FR-013**: When URL params contain invalid enum values, the frontend MUST silently substitute the default value without surfacing an error to the user.
- **FR-014**: The list MUST update without a full page reload when any control changes.
- **FR-014a**: While a control-triggered API request is in-flight, the UI MUST display a subtle loading indicator scoped to the list area; the filter, search, and sort controls MUST remain interactive and must not be disabled.
- **FR-015**: When a filter + search combination returns zero results, the UI MUST display a contextual empty-state message.
- **FR-016**: When controls change in rapid succession, the app MUST ensure only the response for the most recent request is used to update the list; responses for superseded requests MUST be discarded.
- **FR-017**: All existing CRUD flows (create, edit, toggle completion, delete) MUST continue to work correctly while filter/search/sort are active. After a CRUD operation completes, the list MUST reload using the current filter/search/sort params (i.e., URL state is preserved — CRUD does not reset controls to defaults).

**Data and Storage**

- **FR-018**: All filtering, searching, and sorting is performed by the backend against the in-memory store; no client-side data caching or re-sorting is required.
- **FR-019**: If a control-triggered API call fails (network error or unexpected server error), the UI MUST display the existing application error state in the list area (reusing the current error signal and retry mechanism); the prior list content is replaced by the error message.

### Key Entities

- **TodoQueryOptions**: Query options derived from URL/API params with fields `status`, `q`, `sortBy`, `sortDir` (all optional with documented defaults).
- **Validation Error Response**: Existing `{"errors":[{"field":"<name>","message":"<reason>"}]}` shape returned on invalid enum query params.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can locate a target task among 100+ TODOs in under 5 seconds by combining status filter and search.
- **SC-002**: Refreshing a page with filter/search/sort query params reproduces identical controls and list ordering 100% of the time.
- **SC-003**: Calling `GET /api/todos` with no query params returns the same results as before this feature was implemented (full backward compatibility, zero regressions).
- **SC-004**: All new backend and frontend tests pass as part of `mvn clean verify` — the build remains green.
- **SC-005**: Invalid query parameter values consistently return `400` with field-level error details; valid requests never receive `400`.
- **SC-006**: Rapid control changes (5+ changes within 1 second) always result in the list reflecting only the last-applied state; no stale intermediate result is displayed.
- **SC-007**: Browser back and forward navigation across at least 3 distinct view states correctly restores each state without manual refresh.

## Out of Scope

The following items are explicitly excluded from this feature:

- **Pagination**: All matching TODOs are returned in a single response regardless of count.
- **Multi-user or authentication**: The application remains single-user with no login or session management.
- **Fuzzy search, stemming, or relevance ranking**: Search is basic case-insensitive substring matching only.
- **Search highlighting**: Matched text within displayed TODOs is not highlighted.
- **Saved searches or named views**: Users cannot bookmark or name a filter/search/sort configuration beyond the URL itself.
- **Persistent storage**: Data is in-memory only; server restarts clear all TODOs.
- **Real-time updates**: No WebSocket or server-sent events; the list only updates when the user changes a control or performs a CRUD action.
- **Mobile-specific gestures or swipe interactions**: Responsive layout is maintained but no new touch-specific behaviours are added.
- **Debounce or rate-limiting the search input**: The implementation may choose to debounce for UX quality, but it is not a stated requirement.

## Assumptions

- The existing `GET /api/todos` response shape and all other API endpoints remain unchanged.
- Search is applied server-side against the in-memory store; the frontend does not need to cache or locally re-filter the full list.
- The Angular `Router` and `ActivatedRoute` (or equivalent) are used to read/write URL query params; no third-party routing library is added.
- `sortBy=createdAt&sortDir=desc` is the default state when no params are present, matching the current behavior.
- Lexicographic title sorting uses the server's default locale (no locale-aware collation is required).
- URL param persistence applies to list view state only; form input values (title/description in the create or edit form) are not URL-persisted.
