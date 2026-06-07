# Skill: Java Coding Standards

**Scope:** All Java source code in `todo-api/src/main/java/` and `todo-api/src/test/java/`
**Stack:** Java 25 LTS, Spring Boot 3.5.x

---

## Naming Conventions

### Packages
- All lowercase, no underscores: `nz.co.todoapp.todo`, `nz.co.todoapp.common`
- Group by feature, not by layer. Prefer `nz.co.todoapp.todo` (contains controller, service, model, repository) over separate `controller/`, `service/`, `model/` packages at the top level
- Exception: shared cross-cutting concerns go in `nz.co.todoapp.common.exception`, `nz.co.todoapp.common.config`

### Classes and Interfaces
- PascalCase: `TodoService`, `CreateTodoRequest`
- Suffix controllers: `TodoController`
- Suffix services: `TodoService` (interface) or `TodoServiceImpl` only if an interface exists with multiple implementations. If only one implementation, just use `TodoService` as the concrete class
- Suffix request DTOs: `CreateTodoRequest`, `UpdateTodoRequest`
- Suffix response DTOs: `TodoResponse`, `ErrorResponse`
- Suffix exceptions: `TodoNotFoundException extends RuntimeException`
- Suffix configuration: `WebConfig`, `CorsConfig`

### Methods
- camelCase, verb-first: `findById()`, `createTodo()`, `deleteTodo()`
- Boolean getters: `isCompleted()`, `hasDescription()`
- Test methods: `shouldReturnTodoWhenIdExists()`, `shouldThrow404WhenTodoNotFound()`

### Constants
- UPPER_SNAKE_CASE: `MAX_TITLE_LENGTH`, `API_BASE_PATH`
- Define in the class that owns them, not in a shared constants file (unless truly cross-cutting)

### Variables
- camelCase, descriptive: `todoResponse`, `existingTodo`, `updatedAt`
- No single-letter variables except loop indices (`i`, `j`) and lambda parameters where context is obvious (`todos.stream().filter(t -> t.isCompleted())`)
- No Hungarian notation (`strTitle`, `lstTodos`)

---

## Records and DTOs

Use Java records for all immutable data transfer objects. Records are the default choice; only use a class when mutability is required.

```java
// Request DTO -- use with Bean Validation annotations
public record CreateTodoRequest(
    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    String title,

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    String description
) {}

// Response DTO -- maps from domain entity
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
            todo.getId(),
            todo.getTitle(),
            todo.getDescription(),
            todo.isCompleted(),
            todo.getCreatedAt(),
            todo.getUpdatedAt()
        );
    }
}
```

### When NOT to use records
- Domain entities that are mutable (e.g. `Todo` with setters for `title`, `completed`, `updatedAt`)
- Classes that need inheritance
- Classes with complex builder patterns

---

## Optional Usage

- Service methods that look up a single entity by ID return `Optional<T>`, never `null`
- Never use `Optional` as a method parameter or field type
- Never call `.get()` without `.isPresent()` check or use `.orElseThrow()` instead
- Prefer `.map()` and `.orElseThrow()` over if/else branching

```java
// Good
public Optional<Todo> findById(UUID id) {
    return Optional.ofNullable(store.get(id));
}

// In controller
Todo todo = todoService.findById(id)
    .orElseThrow(() -> new TodoNotFoundException(id));

// Bad -- never return null from a lookup method
public Todo findById(UUID id) {
    return store.get(id); // returns null -- caller must remember to check
}
```

---

## Dependency Injection

Constructor injection only. Never use `@Autowired` on fields.

```java
// Good -- explicit constructor (or use Lombok @RequiredArgsConstructor)
@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }
}

// Bad -- field injection
@RestController
public class TodoController {
    @Autowired
    private TodoService todoService; // hidden dependency, untestable
}
```

---

## Immutability and Thread Safety

- The in-memory store uses `ConcurrentHashMap`. All mutations must go through atomic operations (`put`, `compute`, `remove`)
- Domain entities used inside the concurrent map should be defensively copied on read if they are mutable
- Use `Instant` (not `Date`, not `LocalDateTime`) for timestamps -- it is immutable and timezone-agnostic
- Use `UUID` for identifiers -- it is immutable and thread-safe
- Prefer `List.of()`, `Map.of()`, `Set.of()` for immutable collections in return values

---

## Null Handling

- Never return `null` from a public method. Use `Optional<T>` for single-value lookups, empty collections for list lookups
- Use `@Nullable` / `@NonNull` annotations from `org.springframework.lang` on method parameters where the contract is not obvious
- Validate inputs at the boundary (controller layer via Bean Validation), so service code can assume valid inputs

---

## Java 25 Features to Use

- **Records** for DTOs (as above)
- **Pattern matching for instanceof**: `if (ex instanceof TodoNotFoundException e) { ... }`
- **Switch expressions**: `return switch (status) { case ACTIVE -> ...; case COMPLETED -> ...; };`
- **Text blocks** for multi-line strings in tests: `""" { "title": "Test" } """`
- **Sealed classes/interfaces** if modelling a closed set of error types
- **`var`** for local variables where the type is obvious from the right-hand side: `var todos = todoService.findAll();`

### Do NOT use
- Preview features (even if available in Java 25, do not enable `--enable-preview`)
- Virtual threads (not needed for this simple app -- adds complexity without benefit)
- Unsafe or internal APIs

---

## Code Structure Within a Class

Maintain consistent ordering within each class:

1. Static fields (constants)
2. Instance fields
3. Constructor(s)
4. Public methods (grouped logically: CRUD order for services/controllers)
5. Package-private / protected methods
6. Private methods

---

## Anti-Patterns to Avoid

- **God class**: if a service has more than 5-6 public methods, consider splitting by responsibility
- **Stringly-typed code**: use enums or constants, not raw strings for status values, error codes, etc.
- **Catching `Exception`**: catch specific exceptions. If a catch-all is necessary, log the full stack trace and re-throw or wrap
- **Empty catch blocks**: never swallow exceptions silently
- **`@SuppressWarnings` without justification**: always add a comment explaining why the suppression is needed
- **Returning mutable internal state**: return defensive copies or unmodifiable views of collections
