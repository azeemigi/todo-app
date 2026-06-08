# Feature Specification: Todo Due Dates

**Feature Branch**: `004-due-dates`

**Created**: 2026-06-08

**Status**: Draft

**Input**: Add optional due dates to todos. Users can set a due date when creating or editing a todo. The todo list shows visual indicators for overdue and due-today todos. Users can filter the list to show only overdue todos or todos due within the next 7 days.

## Clarifications

### Session 2026-06-08

- Q: Should "Due date" be added as a sort option alongside the existing createdAt/title sort? → A: Yes — add "Due date (soonest first)" and "Due date (latest first)" options. Todos without a due date sort to the bottom when a due-date sort is active.
- Q: How should due dates be displayed on todo cards? → A: Absolute date format, e.g., "Jun 15" (current year omitted when same year, shown in full otherwise).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Set a Due Date on a Todo (Priority: P1)

A user can optionally attach a due date to a todo when creating it or at any later point by editing it. A user can also clear a previously set due date. Todos without a due date behave exactly as they do today.

**Why this priority**: The due date field is the foundational data change that all other stories depend on. Without it, visual indicators and filters have nothing to display or act on.

**Independent Test**: Create a todo with a due date, verify the due date is stored and displayed on the card. Create a todo without a due date, verify nothing changes for that card.

**Acceptance Scenarios**:

1. **Given** the create form is open, **When** the user enters a date and submits, **Then** the todo is saved with that due date visible on its card.
2. **Given** a todo exists without a due date, **When** the user edits it and adds a due date, **Then** the due date appears on the card after saving.
3. **Given** a todo has a due date, **When** the user edits it and clears the date field, **Then** the due date is removed and the card no longer shows a date.
4. **Given** the create form is open, **When** the user submits without entering a due date, **Then** the todo is created successfully with no due date.

---

### User Story 2 — Visual Due Status Indicators (Priority: P2)

Todo cards display a clear visual indicator when a todo is overdue (due date is in the past) or due today. Completed todos do not show overdue or due-today indicators — completion takes precedence.

**Why this priority**: Once due dates exist, users need at-a-glance awareness of urgency without having to inspect every card. This is the primary value of due dates in a task management context.

**Independent Test**: Create three todos — one with yesterday's date, one with today's date, one with a future date — and verify the cards show the correct indicator on each, with no indicator on the future-dated card.

**Acceptance Scenarios**:

1. **Given** a todo's due date is earlier than today and it is not completed, **When** the todo list is displayed, **Then** the card shows an "Overdue" indicator.
2. **Given** a todo's due date is today and it is not completed, **When** the todo list is displayed, **Then** the card shows a "Due today" indicator.
3. **Given** a todo's due date is in the future, **When** the todo list is displayed, **Then** the card shows the due date but no urgency indicator.
4. **Given** a todo is overdue, **When** the user marks it as completed, **Then** the "Overdue" indicator disappears.
5. **Given** a todo has no due date, **When** the todo list is displayed, **Then** the card shows no date or indicator.

---

### User Story 3 — Filter by Due Status (Priority: P3)

Users can filter the todo list to show only todos that are overdue or due within the next 7 days. These are quick-filter options that layer on top of the existing status filter (all / active / completed).

**Why this priority**: Filtering by urgency is how users triage their workload. It completes the feature by making due dates actionable, not just decorative.

**Independent Test**: With a mix of overdue, due-today, due-in-3-days, and due-in-10-days todos, apply the "Overdue" filter and verify only past-due todos appear; apply the "Due this week" filter and verify todos due within 7 days (including today) appear.

**Acceptance Scenarios**:

1. **Given** the "Overdue" filter is selected, **When** the list renders, **Then** only incomplete todos with a due date earlier than today are shown.
2. **Given** the "Due this week" filter is selected, **When** the list renders, **Then** only todos with a due date between today and 7 days from now (inclusive) are shown, regardless of completion status.
3. **Given** a due-date filter is active, **When** the user switches to the "All" filter, **Then** all todos are shown again.
4. **Given** no todos match the active due-date filter, **When** the list renders, **Then** the empty-state message reflects the active filter (e.g., "No overdue TODOs").

---

### Edge Cases

- What happens when a user enters an invalid date format? The form rejects the input and shows a validation message; the todo is not saved.
- What happens if the system clock advances past midnight while the app is open? Indicators reflect the date at the time of page load; a refresh brings them up to date.
- A todo due exactly at midnight of the current day is considered "due today," not overdue.
- Completed todos can still have due dates and appear in "Due this week" results, but they do not show the "Overdue" indicator.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The due date field MUST be optional on every todo; existing todos without a due date are unaffected.
- **FR-002**: The create-todo form MUST include a date input field for the optional due date.
- **FR-003**: The edit-todo form MUST include a date input field pre-populated with the existing due date (or blank if none).
- **FR-004**: Users MUST be able to clear a previously set due date by blanking the date field and saving.
- **FR-005**: A todo card MUST display an "Overdue" indicator when its due date is before today and the todo is not completed.
- **FR-006**: A todo card MUST display a "Due today" indicator when its due date equals today and the todo is not completed.
- **FR-007**: A todo card MUST display the due date in absolute format (e.g., "Jun 15"; include year when it differs from the current year) when it is set and in the future, with no urgency indicator.
- **FR-008**: Completed todos MUST NOT display "Overdue" or "Due today" indicators regardless of their due date.
- **FR-009**: The filter controls MUST include an "Overdue" option that shows only incomplete todos with a past due date.
- **FR-010**: The filter controls MUST include a "Due this week" option that shows todos due between today and 7 days from today (inclusive), regardless of completion status.
- **FR-011**: Due-date filter options MUST coexist with the existing status filter (all / active / completed) and search/sort controls.
- **FR-012**: The sort controls MUST include "Due date (soonest first)" and "Due date (latest first)" options. Todos without a due date MUST sort to the bottom when either due-date sort option is active.

### Key Entities

- **Todo** (extended): gains an optional `dueDate` attribute representing a calendar date (no time component). A todo without a `dueDate` is in the same state as before this feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add, edit, and clear a due date on any todo in a single interaction with no additional navigation steps.
- **SC-002**: Overdue and due-today indicators appear on the correct cards within one second of the list loading.
- **SC-003**: Applying the "Overdue" or "Due this week" filter returns results that are 100% accurate relative to today's date.
- **SC-004**: Todos without a due date behave identically to how they did before this feature — no regressions in existing functionality.
- **SC-005**: All existing filter, search, and sort combinations continue to work correctly when a due-date filter is also active.

## Assumptions

- Due dates are **date-only** (no time or timezone component). Overdue/due-today comparisons are made against the local calendar date at the time of page load.
- "Due this week" means within the next 7 calendar days from today, inclusive of today and the 7th day.
- Completed todos retain their due date in storage and can appear in "Due this week" results, but do not show urgency indicators.
- The existing "status" filter (all / active / completed) and the new due-date filter apply independently — a user could combine "Active" status with "Overdue" to see only incomplete overdue todos.
- Date input uses the browser's native date picker (no custom calendar widget required).
- There is no notification or reminder system for upcoming due dates — this feature is display and filter only.
