# Feature Specification: TODO Application — REST API & Angular SPA

**Feature Branch**: `001-todo-rest-spa`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "Build a TODO application with a REST API backend and an Angular single-page frontend."

## Clarifications

### Session 2026-06-07

- Q: What JSON shape should the API use for 400 validation error responses? → A: Simple array — `{"errors":[{"field":"<name>","message":"<reason>"}]}`
- Q: Should completion toggling use PUT (single endpoint) or a dedicated PATCH endpoint? → A: Two endpoints — `PUT` for full replace, `PATCH /api/todos/{id}` for completion toggle only
- Q: How should Angular shared TODO list state be managed across components? → A: Single `TodoService` with a `signal<Todo[]>`; all components read the signal, all mutations go through service methods
- Q: Are Angular Karma tests included in `mvn clean verify` or run separately? → A: Included in `mvn clean verify` via `frontend-maven-plugin` running `ng test --watch=false --browsers=ChromeHeadless`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View and Browse TODOs (Priority: P1)

A user opens the application and immediately sees their full list of TODOs, displayed
newest-first in a card or list layout. Each item shows its title, optional description,
completion status, and creation date. The list is usable on both desktop and mobile.

**Why this priority**: Without being able to see TODOs, no other feature has value.
This is the foundation every other story builds on.

**Independent Test**: Can be fully tested by seeding the system with several TODOs (via
the API) and loading the app — the list must render all items newest-first with correct
data, on both a wide and narrow viewport.

**Acceptance Scenarios**:

1. **Given** the system contains no TODOs, **When** the user opens the app, **Then** an
   empty-state message is displayed inviting the user to create their first TODO.
2. **Given** the system contains multiple TODOs, **When** the user opens the app, **Then**
   all TODOs are shown, ordered newest-first, each displaying title, description (if any),
   completion status, and creation date.
3. **Given** the app is loading data, **When** the request is in-flight, **Then** a
   loading indicator is visible and the list is not shown until data arrives.
4. **Given** the data request fails, **When** an error occurs, **Then** a user-friendly
   error message is displayed with an option to retry.
5. **Given** the user is on a mobile-sized screen, **When** the list is displayed, **Then**
   all TODO cards are readable and usable without horizontal scrolling.

---

### User Story 2 - Create a New TODO (Priority: P2)

A user fills in a form with a title (required) and optional description, submits it, and
the new TODO immediately appears at the top of the list.

**Why this priority**: Creating TODOs is the primary write action; without it the app
has no content.

**Independent Test**: Can be tested by submitting the creation form and verifying the
new item appears at the top of the list with correct data, without a page reload.

**Acceptance Scenarios**:

1. **Given** the create form is visible, **When** the user enters a title and submits,
   **Then** a new TODO is added to the top of the list and the form is cleared/reset.
2. **Given** the create form is visible, **When** the user submits without a title,
   **Then** a validation error is shown beside the title field and the form is not submitted.
3. **Given** the create form is visible, **When** the user enters a title longer than
   200 characters, **Then** a validation error is shown and the form is not submitted.
4. **Given** the create form is visible, **When** the user enters a description longer
   than 1000 characters, **Then** a validation error is shown and the form is not submitted.
5. **Given** the create request fails (network/server error), **When** the user submits,
   **Then** an error message is shown and the form retains its values so the user can retry.

---

### User Story 3 - Mark a TODO Complete or Incomplete (Priority: P3)

A user can toggle the completion state of any TODO via a checkbox on the list. The
visual style of the card updates immediately to reflect the new state (e.g., strikethrough
or muted colour for completed items).

**Why this priority**: Completing TODOs is the core action of any task manager. It
delivers direct user value once the list and creation flows exist.

**Independent Test**: Can be tested by clicking the checkbox on an existing TODO — the
item's visual style must update and the state must persist across a page reload.

**Acceptance Scenarios**:

1. **Given** a TODO is incomplete, **When** the user clicks its checkbox, **Then** the
   TODO is marked complete and its visual style updates to indicate completion.
2. **Given** a TODO is complete, **When** the user clicks its checkbox, **Then** the
   TODO is marked incomplete and its visual style reverts to the incomplete style.
3. **Given** a toggle request fails, **When** the checkbox is clicked, **Then** the
   checkbox reverts to its previous state and an error message is shown.

---

### User Story 4 - Edit an Existing TODO (Priority: P4)

A user can edit the title, description, and completion state of an existing TODO either
inline on the card or in a modal/drawer. Changes are saved without navigating away.

**Why this priority**: Editing is important for correcting mistakes or updating context,
but the app is usable (create, view, complete) without it.

**Independent Test**: Can be tested by opening the edit UI for a TODO, changing its
title and description, saving, and verifying the updated values appear in the list
without a page reload.

**Acceptance Scenarios**:

1. **Given** a TODO is displayed, **When** the user activates the edit action (button or
   inline click), **Then** an edit form pre-populated with the current values is presented.
2. **Given** the edit form is open, **When** the user changes the title and saves,
   **Then** the TODO in the list reflects the new title immediately.
3. **Given** the edit form is open, **When** the user clears the title and tries to save,
   **Then** a validation error is shown and the save is blocked.
4. **Given** the edit form is open, **When** the user cancels, **Then** the form closes
   and the TODO is unchanged.
5. **Given** the save request fails, **When** the user saves, **Then** an error message
   is displayed and the edit form remains open with the user's changes intact.

---

### User Story 5 - Delete a TODO (Priority: P5)

A user can permanently delete a TODO. A confirmation step (dialog or inline confirm)
prevents accidental deletion.

**Why this priority**: Deletion is a destructive action and less critical than the above
flows; confirmation is required to protect users from accidents.

**Independent Test**: Can be tested by clicking delete on a TODO, confirming, and
verifying the item is removed from the list without a page reload.

**Acceptance Scenarios**:

1. **Given** a TODO is displayed, **When** the user clicks the delete action, **Then** a
   confirmation prompt is shown before any deletion occurs.
2. **Given** the confirmation prompt is shown, **When** the user confirms, **Then** the
   TODO is removed from the list and no longer visible.
3. **Given** the confirmation prompt is shown, **When** the user cancels, **Then** the
   TODO remains in the list unchanged.
4. **Given** the delete request fails, **When** the user confirms deletion, **Then** an
   error message is shown and the TODO remains visible in the list.

---

### Edge Cases

- What happens when a TODO is created with only whitespace as the title? The system
  must reject it with a validation error (title is effectively empty).
- What happens when two updates to the same TODO are submitted near-simultaneously?
  The last write wins; no explicit conflict resolution is required given single-user scope.
- What happens when the API is unreachable on initial load? The error state is shown
  with a retry option; no cached data is displayed.
- What happens when a TODO's description is absent? The description area is hidden or
  shows a placeholder; no "null" or empty string is displayed literally.
- What happens if the user rapidly toggles the completion checkbox? Debounce or
  disable the control during the in-flight request to prevent duplicate submissions.

## Requirements *(mandatory)*

### Functional Requirements

**Data**

- **FR-001**: The system MUST store each TODO with the following fields: a unique
  identifier (server-generated), a title (required, 1–200 characters), an optional
  description (max 1000 characters), a completion flag (default false), a creation
  timestamp (server-generated), and a last-updated timestamp (server-generated).
- **FR-002**: The system MUST reject a blank or whitespace-only title with a
  descriptive validation error.
- **FR-003**: The system MUST automatically set creation and update timestamps;
  clients MUST NOT supply these values.

**API**

- **FR-004**: The system MUST expose `GET /api/todos` returning all TODOs ordered
  newest-first.
- **FR-005**: The system MUST expose `GET /api/todos/{id}` returning a single TODO,
  or a 404 response if not found.
- **FR-006**: The system MUST expose `POST /api/todos` accepting title and optional
  description, returning the created TODO with a 201 status.
- **FR-007**: The system MUST expose `PUT /api/todos/{id}` accepting title,
  description, and completed flag (full replacement), returning the updated TODO;
  404 if not found.
- **FR-007b**: The system MUST expose `PATCH /api/todos/{id}` accepting only the
  completed flag (partial update for completion toggle), returning the updated TODO;
  404 if not found. The frontend MUST use this endpoint when the user toggles the
  checkbox.
- **FR-008**: The system MUST expose `DELETE /api/todos/{id}` returning 204 on
  success; 404 if not found.
- **FR-009**: The system MUST return 400 responses for invalid input with a JSON body
  of the form `{"errors":[{"field":"<name>","message":"<reason>"}]}` — one entry per
  failing field.
- **FR-010**: All API responses MUST use JSON format.

**Frontend**

- **FR-010b**: All frontend components MUST obtain TODO data exclusively through a
  single `TodoService` that owns a `signal<Todo[]>` as the shared source of truth.
  Components read the signal; mutations (create, update, delete, toggle) call service
  methods that update the signal after a successful API response.
- **FR-011**: The frontend MUST display all TODOs in a list or card layout, ordered
  newest-first.
- **FR-012**: The frontend MUST show a form allowing users to create a new TODO.
- **FR-013**: The frontend MUST allow users to toggle a TODO's completion state via
  a checkbox control. The toggle MUST call `PATCH /api/todos/{id}` and update the
  shared `TodoService` signal on success.
- **FR-014**: The frontend MUST allow users to edit a TODO's title and description
  (inline or via a modal/drawer).
- **FR-015**: The frontend MUST require user confirmation before deleting a TODO.
- **FR-016**: The frontend MUST display a loading indicator while data requests are
  in-flight.
- **FR-017**: The frontend MUST display user-friendly error messages when requests
  fail, with a way to retry where applicable.
- **FR-018**: The frontend MUST be usable on both mobile (320px+) and desktop
  (1280px+) viewports without horizontal scrolling.
- **FR-019**: Completed TODOs MUST be visually distinct from incomplete ones (e.g.,
  strikethrough text, muted colour, or checked icon).

**Build & Run**

- **FR-020**: The entire application (backend + frontend) MUST build and all tests
  MUST pass via a single `mvn clean verify` command. This includes both JUnit 5
  backend tests and Angular Karma tests, the latter executed via
  `frontend-maven-plugin` running `ng test --watch=false --browsers=ChromeHeadless`
  during the Maven `test` phase of the `todo-ui` module.
- **FR-021**: The application MUST be runnable as a single process serving both the
  API and the Angular SPA on port 8080.

### Key Entities

- **TODO**: The core task item. Attributes: unique identifier, title, optional
  description, completion state, creation time, last-updated time.
- **Validation Error Response**: Represents a failed API request. JSON shape:
  `{"errors":[{"field":"<name>","message":"<reason>"}]}` — one object per failing
  field, returned with HTTP 400.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create, view, complete, edit, and delete a TODO entirely
  within the browser without any page reload.
- **SC-002**: The TODO list loads and renders within 2 seconds on a standard broadband
  connection when the system contains up to 100 items.
- **SC-003**: All five primary user actions (view, create, complete, edit, delete) are
  accessible and functional on a 375px-wide mobile screen without horizontal scrolling.
- **SC-004**: Invalid input (missing title, oversized fields) is rejected with a clear,
  field-level message before any data is persisted.
- **SC-005**: The application builds, all tests pass, and the server starts in a single
  command with no additional setup steps.
- **SC-006**: Deleting a TODO requires explicit confirmation; no TODO is removed by a
  single accidental click.

## Assumptions

- The application is single-user; no authentication, authorisation, or multi-tenancy
  is required.
- Data durability is not required; in-memory storage is sufficient and data loss on
  server restart is acceptable.
- No search, filter, or sort controls beyond the default newest-first ordering are
  required for this version.
- No pagination is required; all TODOs are loaded in a single request (reasonable for
  a personal task list with up to a few hundred items).
- The Angular app is served as a static SPA by the same process as the API; no CDN or
  separate web server is required.
- Browser support targets modern evergreen browsers (Chrome, Firefox, Safari, Edge —
  last 2 major versions); no IE or legacy mobile browser support.
- No offline capability or service worker is required.
- No internationalisation (i18n) or accessibility beyond semantic HTML and keyboard-
  navigable interactive elements is required for this version.
