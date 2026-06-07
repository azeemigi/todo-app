# Skill: Logging and Error Handling

**Scope:** All Java code in `todo-api/` and Angular code in `todo-ui/`
**Stack:** SLF4J + Logback (Spring Boot default), Angular HttpErrorResponse

---

## Part 1: Backend Logging (Java / Spring Boot)

### Logger Declaration

Use SLF4J via `LoggerFactory`. One logger per class, declared as a `private static final` field.

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TodoService {
    private static final Logger log = LoggerFactory.getLogger(TodoService.class);
}
```

Alternative: use Lombok `@Slf4j` annotation if Lombok is in the project.

```java
@Slf4j
public class TodoService {
    // log.info(...) is available automatically
}
```

### Log Levels

| Level | When to Use | Example |
|---|---|---|
| **ERROR** | Unexpected failure that breaks the current operation. Something a developer must investigate. | Exception in service, failed to process request, data corruption |
| **WARN** | Recoverable issue or something that should not happen often. Not broken, but suspicious. | Retry succeeded after failure, deprecated method called, approaching limit |
| **INFO** | Significant business events and state changes. The "what happened" log. | TODO created, TODO deleted, application started, configuration loaded |
| **DEBUG** | Detailed flow information useful during development and troubleshooting. | Method entry/exit with parameters, intermediate computation results |
| **TRACE** | Very fine-grained diagnostic data. Rarely used in application code. | Raw HTTP payloads, serialisation details |

### Logging Patterns

```java
// INFO -- business events (state changes)
log.info("Created TODO: id={}, title='{}'", todo.getId(), todo.getTitle());
log.info("Deleted TODO: id={}", id);
log.info("Updated TODO: id={}, completed={}", id, request.completed());

// DEBUG -- flow and diagnostics
log.debug("Finding TODO by id: {}", id);
log.debug("Returning {} TODOs", todos.size());

// WARN -- recoverable oddities
log.warn("Attempted to delete non-existent TODO: id={}", id);

// ERROR -- unexpected failures (always include the exception)
log.error("Failed to process TODO creation: title='{}'", request.title(), ex);
```

### Logging Rules

1. **Always use parameterised logging** -- use `{}` placeholders, never string concatenation
   ```java
   // Good
   log.info("Created TODO: id={}", id);

   // Bad -- string concatenation evaluated even if level is disabled
   log.info("Created TODO: id=" + id);
   ```

2. **Always include the exception as the last argument** when logging errors
   ```java
   // Good -- SLF4J prints the full stack trace
   log.error("Failed to create TODO", ex);

   // Bad -- loses the stack trace
   log.error("Failed to create TODO: " + ex.getMessage());
   ```

3. **Log at the right layer** -- log once at the point of handling, not at every layer the exception passes through
   - Service catches and handles/wraps: log at service level
   - Exception propagates to `@RestControllerAdvice`: log there
   - Do NOT log the same exception in the service AND the controller advice

4. **Never log sensitive data** -- passwords, tokens, personal information. This project has none, but the rule stands

5. **Include enough context** -- a log message should be useful without reading the code. Include the relevant identifiers (TODO id, request field values)

6. **No log-and-throw** -- if you log an exception and then re-throw or wrap it, the upstream handler will log it again. Choose one: log and handle, or throw and let the handler log

### Default Log Configuration

In `application.properties` or `application.yml`:

```yaml
logging:
  level:
    root: INFO
    nz.co.todoapp: DEBUG       # Application code at DEBUG in dev
    org.springframework.web: INFO
  pattern:
    console: "%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
```

---

## Part 2: Backend Error Handling

### Exception Hierarchy

Define custom exceptions for known error cases. Keep it simple -- one or two custom exceptions are enough for this project.

```java
// Not found -- thrown when a resource lookup fails
public class TodoNotFoundException extends RuntimeException {
    private final UUID todoId;

    public TodoNotFoundException(UUID todoId) {
        super("TODO not found: " + todoId);
        this.todoId = todoId;
    }

    public UUID getTodoId() {
        return todoId;
    }
}
```

### Global Exception Handler

A single `@RestControllerAdvice` handles all exceptions and returns consistent `ErrorResponse` objects. This is the ONE place that maps exceptions to HTTP status codes.

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Bean Validation failures (400)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult()
            .getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value",
                (first, second) -> first  // keep first if duplicate field
            ));
        log.debug("Validation failed: {}", fieldErrors);
        return ErrorResponse.ofValidation(fieldErrors);
    }

    // Resource not found (404)
    @ExceptionHandler(TodoNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(TodoNotFoundException ex) {
        log.debug("Resource not found: {}", ex.getMessage());
        return ErrorResponse.of(404, ex.getMessage());
    }

    // Malformed JSON (400)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleMalformedJson(HttpMessageNotReadableException ex) {
        log.debug("Malformed request body: {}", ex.getMessage());
        return ErrorResponse.of(400, "Malformed request body");
    }

    // Invalid path variable type (e.g. non-UUID in path) (400)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        log.debug("Invalid path variable: {} = '{}'", ex.getName(), ex.getValue());
        return ErrorResponse.of(400, "Invalid value for parameter: " + ex.getName());
    }

    // Catch-all for unexpected errors (500)
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);  // Full stack trace logged
        return ErrorResponse.of(500, "An unexpected error occurred");
    }
}
```

### Error Handling Rules

1. **Never catch Exception in service/controller code** unless you are the global handler. Let exceptions propagate to `@RestControllerAdvice`
2. **Never return null from a controller** to indicate "not found". Throw `TodoNotFoundException` and let the handler map it to 404
3. **Never expose internal details** -- stack traces, class names, SQL queries must never appear in API responses
4. **Consistent error shape** -- every error response uses `ErrorResponse`, no exceptions
5. **Validation errors include field details** -- the `fieldErrors` map tells the frontend exactly which field failed and why
6. **Log at the handler, not the thrower** -- the service throws `TodoNotFoundException`, the handler logs it. Avoids double-logging

---

## Part 3: Frontend Error Handling (Angular)

### HTTP Error Interceptor

Create a functional interceptor that catches HTTP errors and provides consistent handling.

```typescript
// core/interceptors/error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error(`HTTP Error: ${error.status} ${error.url}`, error);

      // Let the calling component handle the specific error
      return throwError(() => error);
    })
  );
};
```

Register in `app.config.ts`:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([errorInterceptor])),
    // ...
  ],
};
```

### Component-Level Error Handling

Components handle errors from service calls and update the UI accordingly.

```typescript
export class TodoListComponent {
  error = signal<string | null>(null);
  loading = signal(false);

  loadTodos(): void {
    this.loading.set(true);
    this.error.set(null);

    this.todoService.findAll().pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (todos) => this.todos.set(todos),
      error: (err: HttpErrorResponse) => {
        if (err.status === 0) {
          this.error.set('Unable to connect to the server. Please try again.');
        } else {
          this.error.set(err.error?.message ?? 'An unexpected error occurred.');
        }
      },
    });
  }
}
```

### Frontend Error Handling Rules

1. **Always handle errors in subscribe** -- never leave the `error` callback empty
2. **Show user-friendly messages** -- translate HTTP status codes into readable text. Never show raw JSON error bodies to the user
3. **Handle network failures** (status 0) separately -- "Unable to connect" is more helpful than "Unknown error"
4. **Use loading and error signals** -- every component that makes HTTP calls needs `loading` and `error` state signals
5. **Use `finalize()`** to clear loading state regardless of success or failure
6. **Log errors to console** in development. In production, consider a remote error reporting service (but not for this project)
7. **Display validation errors inline** -- when the API returns 400 with `fieldErrors`, map them to the corresponding form controls

### Displaying Validation Errors from the API

```typescript
// After a 400 response with fieldErrors
handleApiValidationErrors(err: HttpErrorResponse): void {
  if (err.status === 400 && err.error?.fieldErrors) {
    const fieldErrors: Record<string, string> = err.error.fieldErrors;
    for (const [field, message] of Object.entries(fieldErrors)) {
      const control = this.todoForm.get(field);
      if (control) {
        control.setErrors({ serverError: message });
      }
    }
  }
}
```

---

## Anti-Patterns to Avoid

### Backend
- **Empty catch blocks**: never `catch (Exception e) { }`. Either handle it, log it, or let it propagate
- **Catch and return null**: throw a meaningful exception instead
- **Log and throw**: choose one. Doing both causes duplicate log entries
- **Generic error messages**: "Something went wrong" with no log context makes debugging impossible
- **Catching `Exception` or `Throwable` in business code**: catch the specific exception you expect

### Frontend
- **Ignoring HTTP errors**: every `subscribe()` or `toSignal()` with HTTP calls must handle the error case
- **Alert boxes for errors**: use inline error messages in the UI, not `window.alert()`
- **Logging `error.message` only**: log the full `HttpErrorResponse` object for debugging context
- **Retrying without backoff**: if adding retry logic later, always use exponential backoff (`retry` with `delay`)
