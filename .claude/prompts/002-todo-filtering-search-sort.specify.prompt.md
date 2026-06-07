# Speckit Specify Prompt: 002 TODO Filtering, Search, Sort

Use this prompt with `/speckit.specify` for feature `002-todo-filtering-search-sort`.

```text
/speckit.specify Create feature 002-todo-filtering-search-sort for the TODO app. Add list controls for status filter (all, active, completed), text search across title and description, and sorting by createdAt (asc/desc) and title (asc/desc). Extend GET /api/todos with optional query params: status, q, sortBy, sortDir. Preserve backward compatibility so no params returns current newest-first behavior. Invalid query values must return 400 using the existing validation error shape. In Angular, make URL query params the source of truth so filter/search/sort state persists on refresh, deep links, and browser back/forward navigation. Include empty-state behavior for no matches and robust handling of rapid control changes so stale responses do not overwrite newer state. Keep scope single-user, in-memory storage, no pagination, no auth. Define clear user stories, acceptance criteria, edge cases, measurable success criteria, and explicit out-of-scope items.
```
