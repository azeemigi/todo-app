# Skill: REST API Design

**Scope:** All REST endpoints in `todo-api/src/main/java/`
**Stack:** Spring Boot 3.5.x, Spring Web MVC, Bean Validation

---

## URL Design

### Base Path
All API endpoints live under `/api/`. The Angular frontend is served from `/` (root). This separation prevents routing conflicts.

### Resource Naming
- Plural nouns for collections: `/api/todos`, not `/api/todo`
- Resource identifier in the path: `/api/todos/{id}`
- No verbs in URLs: use HTTP methods to express actions
- Lowercase, hyphen-separated for multi-word resources: `/api/todo-items` (not needed for this project, but the rule applies)

### URL Patterns

| Operation | Method | URL | Request Body | Response |
|---|---|---|---|---|
| List all | GET | `/api/todos` | -- | `200` + `Todo[]` |
| Get one | GET | `/api/todos/{id}` | -- | `200` + `Todo` or `404` |
| Create | POST | `/api/todos` | `CreateTodoRequest` | `201` + `Todo` + `Location` header |
| Full update | PUT | `/api/todos/{id}` | `UpdateTodoRequest` | `200` + `Todo` or `404` |
| Delete | DELETE | `/api/todos/{id}` | -- | `204` or `404` |

---

## HTTP Methods

- **GET**: read-only, safe, idempotent. Never mutate state in a GET handler
- **POST**: create a new resource. Not idempotent (calling twice creates two resources)
- **PUT**: full replacement of an existing resource. Idempotent. The request body must contain the full updated state (not a partial patch)
- **DELETE**: remove a resource. Idempotent (deleting twice should not error on the second call -- but returning 404 on the second call is also acceptable for this project)

### PATCH (not used in this project)
If partial updates are needed later, use PATCH with a JSON body containing only the fields to update. Do not implement PATCH unless explicitly requested.

---

## HTTP Status Codes

### Success
- `200 OK` -- successful GET, PUT
- `201 Created` -- successful POST. Include a `Location` header pointing to the new resource
- `204 No Content` -- successful DELETE. No response body

### Client Errors
- `400 Bad Request` -- validation failure (missing required fields, constraint violations). Return an `ErrorResponse` with field-level details
- `404 Not Found` -- resource does not exist. Return an `ErrorResponse` with a message
- `405 Method Not Allowed` -- Spring handles this automatically

### Server Errors
- `500 Internal Server Error` -- unexpected failure. Return a generic `ErrorResponse`. Log the full stack trace server-side. Never expose stack traces or internal details to the client

---

## Request / Response Contract

### Request DTOs

Use Java records with Bean Validation annotations. Keep request DTOs separate from response DTOs -- they serve different purposes and evolve independently.

```java
public record CreateTodoRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    String title,

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    String description
) {}

public record UpdateTodoRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    String title,

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    String description,

    @NotNull(message = "Completed status is required")
    Boolean completed
) {}
```

### Response DTOs

```java
public record TodoResponse(
    UUID id,
    String title,
    String description,
    boolean completed,
    Instant createdAt,
    Instant updatedAt
) {
    public static TodoResponse from(Todo todo) {
        return new TodoResponse(
            todo.getId(), todo.getTitle(), todo.getDescription(),
            todo.isCompleted(), todo.getCreatedAt(), todo.getUpdatedAt()
        );
    }
}
```

### Error Response (consistent across all error types)

```java
public record ErrorResponse(
    int status,
    String message,
    Instant timestamp,
    Map<String, String> fieldErrors  // null when not a validation error
) {
    public static ErrorResponse of(int status, String message) {
        return new ErrorResponse(status, message, Instant.now(), null);
    }

    public static ErrorResponse ofValidation(Map<String, String> fieldErrors) {
        return new ErrorResponse(400, "Validation failed", Instant.now(), fieldErrors);
    }
}
```

---

## Controller Pattern

```java
@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public List<TodoResponse> findAll() {
        return todoService.findAll().stream()
            .map(TodoResponse::from)
            .toList();
    }

    @GetMapping("/{id}")
    public TodoResponse findById(@PathVariable UUID id) {
        return todoService.findById(id)
            .map(TodoResponse::from)
            .orElseThrow(() -> new TodoNotFoundException(id));
    }

    @PostMapping
    public ResponseEntity<TodoResponse> create(@Valid @RequestBody CreateTodoRequest request) {
        Todo created = todoService.create(request);
        TodoResponse response = TodoResponse.from(created);
        URI location = URI.create("/api/todos/" + created.getId());
        return ResponseEntity.created(location).body(response);
    }

    @PutMapping("/{id}")
    public TodoResponse update(@PathVariable UUID id,
                               @Valid @RequestBody UpdateTodoRequest request) {
        return todoService.update(id, request)
            .map(TodoResponse::from)
            .orElseThrow(() -> new TodoNotFoundException(id));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        if (!todoService.delete(id)) {
            throw new TodoNotFoundException(id);
        }
    }
}
```

### Controller Rules
- Controllers are thin: validate input (via `@Valid`), delegate to services, map responses
- No business logic in controllers
- Use `@Valid` on all `@RequestBody` parameters
- Return `ResponseEntity` only when you need to set headers (e.g. `Location` on 201). Otherwise, return the DTO directly
- Use `@ResponseStatus` for non-200 success codes (e.g. `204` for delete)
- Path variables for resource identification, request body for data payloads, query parameters for filtering/sorting (if needed later)

---

## Content Negotiation

- Produce and consume `application/json` only (Spring Boot default)
- Do not configure XML support
- Jackson handles serialisation automatically. Configure globally in `application.properties` or `application.yml`:

```yaml
spring:
  jackson:
    serialization:
      write-dates-as-timestamps: false    # ISO 8601 format for Instant
    default-property-inclusion: non_null   # Omit null fields from JSON
```

---

## CORS Configuration

For development (Angular dev server on port 4200 proxying to Spring Boot on 8080), use a proxy config in Angular rather than CORS headers on the server.

For production-like mode (Angular served from Spring Boot static resources), no CORS is needed since everything is same-origin.

If CORS must be configured (e.g. for external clients), do it in a `@Configuration` class, not per-controller:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:4200")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("*");
    }
}
```

---

## Versioning (not used in this project)

This project does not version the API. If versioning is needed later, prefer URL-based versioning (`/api/v1/todos`) over header-based versioning. Do not implement versioning unless explicitly requested.

---

## Anti-Patterns to Avoid

- **Exposing domain entities directly**: always map to a response DTO. Internal fields (e.g. soft-delete flags, audit metadata) must never leak to the client
- **Inconsistent error format**: every error response must use the same `ErrorResponse` structure
- **Swallowing 404**: if a resource is not found, return 404 with a message. Do not return 200 with null or an empty body
- **Business logic in controllers**: controllers validate and delegate. Period
- **Over-engineering**: no HATEOAS, no HAL, no pagination, no filtering until explicitly requested. Keep the API surface minimal
- **Exposing stack traces**: never include Java stack traces in API responses. Log them server-side at ERROR level
