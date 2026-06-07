# Skill: Testing Standards

**Scope:** All test code in `todo-api/src/test/java/` and `todo-ui/src/**/*.spec.ts`
**Stack:** JUnit 5 + Mockito + Spring Test (backend), Jasmine + Karma (frontend)

---

## Part 1: Backend Testing (Java)

### Test Classification

| Type | Annotation | Scope | Speed | When to use |
|---|---|---|---|---|
| Unit test | None (plain JUnit 5) | Single class, mocked dependencies | Fast (ms) | Service logic, utility methods, model mappings |
| Web layer test | `@WebMvcTest` | Controller + Spring MVC infrastructure | Medium (1-2s) | HTTP mapping, validation, serialisation, status codes |
| Integration test | `@SpringBootTest` | Full context | Slow (3-5s) | Not needed for this project (no database, no external services) |

**For this project, use only unit tests and web layer tests.** No `@SpringBootTest` unless explicitly requested.

### Test File Location and Naming

```
todo-api/src/test/java/nz/co/todoapp/
├── todo/
│   ├── TodoControllerTest.java      # @WebMvcTest
│   ├── TodoServiceTest.java         # Unit test
│   └── TodoResponseTest.java        # Unit test for mapping
└── common/
    └── exception/
        └── GlobalExceptionHandlerTest.java  # @WebMvcTest
```

- Test class name: `{ClassUnderTest}Test.java`
- Test file mirrors the source package structure

### Test Method Naming

Use descriptive `should...When...` naming:

```java
@Test
void shouldReturnAllTodos() { }

@Test
void shouldReturnTodoWhenIdExists() { }

@Test
void shouldThrow404WhenTodoNotFound() { }

@Test
void shouldReturn400WhenTitleIsBlank() { }

@Test
void shouldCreateTodoAndReturn201WithLocationHeader() { }

@Test
void shouldReturn204WhenDeleteSucceeds() { }
```

### Unit Test Pattern (Service Layer)

```java
@ExtendWith(MockitoExtension.class)
class TodoServiceTest {

    @InjectMocks
    private TodoService todoService;

    // No mocks needed -- TodoService uses an internal ConcurrentHashMap
    // If it had dependencies, mock them with @Mock

    @Test
    void shouldCreateTodoWithGeneratedIdAndTimestamps() {
        // Given
        var request = new CreateTodoRequest("Test TODO", "Description");

        // When
        Todo result = todoService.create(request);

        // Then
        assertThat(result.getId()).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Test TODO");
        assertThat(result.getDescription()).isEqualTo("Description");
        assertThat(result.isCompleted()).isFalse();
        assertThat(result.getCreatedAt()).isNotNull();
        assertThat(result.getUpdatedAt()).isNotNull();
    }

    @Test
    void shouldReturnEmptyOptionalWhenTodoNotFound() {
        // Given
        UUID nonExistentId = UUID.randomUUID();

        // When
        Optional<Todo> result = todoService.findById(nonExistentId);

        // Then
        assertThat(result).isEmpty();
    }
}
```

### Web Layer Test Pattern (Controller)

```java
@WebMvcTest(TodoController.class)
class TodoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TodoService todoService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldReturnTodoWhenIdExists() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        Todo todo = createSampleTodo(id, "Test", false);
        when(todoService.findById(id)).thenReturn(Optional.of(todo));

        // When / Then
        mockMvc.perform(get("/api/todos/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id.toString()))
            .andExpect(jsonPath("$.title").value("Test"))
            .andExpect(jsonPath("$.completed").value(false));
    }

    @Test
    void shouldReturn404WhenTodoNotFound() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        when(todoService.findById(id)).thenReturn(Optional.empty());

        // When / Then
        mockMvc.perform(get("/api/todos/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void shouldReturn400WhenTitleIsBlank() throws Exception {
        // Given
        var request = new CreateTodoRequest("", null);

        // When / Then
        mockMvc.perform(post("/api/todos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fieldErrors.title").exists());
    }

    @Test
    void shouldReturn201WithLocationHeaderOnCreate() throws Exception {
        // Given
        UUID id = UUID.randomUUID();
        var request = new CreateTodoRequest("New TODO", "Description");
        Todo created = createSampleTodo(id, "New TODO", false);
        when(todoService.create(any())).thenReturn(created);

        // When / Then
        mockMvc.perform(post("/api/todos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/api/todos/" + id))
            .andExpect(jsonPath("$.id").value(id.toString()));
    }

    // Helper method
    private Todo createSampleTodo(UUID id, String title, boolean completed) {
        // Build and return a Todo with the given values
    }
}
```

### Backend Testing Rules

1. **Given-When-Then structure** -- every test has three clear sections separated by blank lines and comments
2. **One assertion concept per test** -- a test can have multiple `assertThat()` calls if they verify different aspects of the same result, but should test only one behaviour
3. **Use AssertJ** (`assertThat()`) over JUnit assertions (`assertEquals()`) -- it reads better and has richer matchers
4. **Mock only direct dependencies** -- if `TodoService` has no dependencies (just a ConcurrentHashMap), test it without mocks
5. **Test edge cases explicitly**: empty title, null description, non-existent ID, duplicate operations, boundary lengths (200 chars, 201 chars)
6. **No test interdependence** -- each test sets up its own state. Never rely on execution order
7. **No `@SpringBootTest`** unless testing full-stack integration (not needed for this project)
8. **No Thread.sleep()** -- if testing async behaviour, use `Awaitility` or restructure the code
9. **Test names describe the expected behaviour** -- not the implementation detail

### What to Test

| Layer | What to test | What NOT to test |
|---|---|---|
| Controller | HTTP status codes, JSON structure, validation rejection, header values | Business logic (mocked out) |
| Service | Business rules, state transitions, edge cases, error conditions | Framework behaviour (Spring DI, Jackson) |
| DTOs / Records | Mapping methods (`from()` converters) | Getters, constructors (generated by record) |
| Exception handler | Correct status per exception type, error response structure | -- |

---

## Part 2: Frontend Testing (Angular)

### Test File Location

Every component, service, pipe, and directive has a co-located `.spec.ts` file:

```
todo-list.component.ts
todo-list.component.spec.ts    # <-- right next to the source
```

### Component Test Pattern

```typescript
describe('TodoListComponent', () => {
  let component: TodoListComponent;
  let fixture: ComponentFixture<TodoListComponent>;
  let todoService: jasmine.SpyObj<TodoService>;

  beforeEach(async () => {
    const todoServiceSpy = jasmine.createSpyObj('TodoService', [
      'findAll', 'create', 'update', 'delete'
    ]);

    await TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [
        { provide: TodoService, useValue: todoServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
    component = fixture.componentInstance;
    todoService = TestBed.inject(TodoService) as jasmine.SpyObj<TodoService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display todos when loaded', () => {
    // Given
    const mockTodos: Todo[] = [
      { id: '1', title: 'Test', description: null, completed: false,
        createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
    ];
    todoService.findAll.and.returnValue(of(mockTodos));

    // When
    component.loadTodos();
    fixture.detectChanges();

    // Then
    const todoElements = fixture.nativeElement.querySelectorAll('.todo-item');
    expect(todoElements.length).toBe(1);
  });

  it('should show error message when API fails', () => {
    // Given
    todoService.findAll.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    // When
    component.loadTodos();
    fixture.detectChanges();

    // Then
    expect(component.error()).toBeTruthy();
    const errorEl = fixture.nativeElement.querySelector('.error-banner');
    expect(errorEl).toBeTruthy();
  });

  it('should show loading state while fetching', () => {
    // Given
    todoService.findAll.and.returnValue(NEVER); // never completes

    // When
    component.loadTodos();
    fixture.detectChanges();

    // Then
    expect(component.loading()).toBeTrue();
  });
});
```

### Service Test Pattern

```typescript
describe('TodoService', () => {
  let service: TodoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TodoService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TodoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Ensure no outstanding requests
  });

  it('should fetch all todos', () => {
    const mockTodos: Todo[] = [/* ... */];

    service.findAll().subscribe(todos => {
      expect(todos.length).toBe(1);
      expect(todos[0].title).toBe('Test');
    });

    const req = httpMock.expectOne('/api/todos');
    expect(req.request.method).toBe('GET');
    req.flush(mockTodos);
  });

  it('should send POST to create a todo', () => {
    const request: CreateTodoRequest = { title: 'New', description: 'Desc' };

    service.create(request).subscribe(todo => {
      expect(todo.title).toBe('New');
    });

    const req = httpMock.expectOne('/api/todos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ id: '1', title: 'New', description: 'Desc', completed: false,
                createdAt: '', updatedAt: '' });
  });
});
```

### Frontend Testing Rules

1. **Use `TestBed.configureTestingModule`** with `imports: [ComponentUnderTest]` for standalone components
2. **Mock services with `jasmine.createSpyObj`** -- never make real HTTP calls in unit tests
3. **Use `HttpTestingController`** for service tests -- verify method, URL, and request body
4. **Call `httpMock.verify()` in afterEach** -- ensures no unexpected requests
5. **Test the DOM** -- use `fixture.nativeElement.querySelector()` to verify rendered output
6. **Call `fixture.detectChanges()`** after state changes to trigger re-rendering
7. **Test user interactions** -- simulate clicks with `element.click()` or `element.dispatchEvent(new Event('click'))`
8. **Test error states** -- verify error messages render when the service returns an error
9. **Test loading states** -- use `NEVER` observable or delayed responses
10. **One `describe` per file** matching the class name. Nested `describe` for method groups

### What to Test (Frontend)

| Artifact | What to test |
|---|---|
| Component | Renders correctly, displays data, handles user interaction, shows loading/error states |
| Service | Sends correct HTTP method/URL/body, handles success and error responses |
| Pipes | Transform input correctly, handle null/undefined gracefully |
| Forms | Validation rules, submit behaviour, error display |

---

## Test Coverage Expectations

- **Mandatory**: every public method in services and controllers has at least one test
- **Mandatory**: every HTTP endpoint has tests for success case AND primary error case (404, 400)
- **Mandatory**: validation rules have tests for both valid and invalid inputs
- **Nice to have**: edge cases (empty collections, max-length strings, concurrent operations)
- **Not required**: testing framework-generated code (record constructors, Angular lifecycle hooks unless custom logic is added)

---

## Running Tests

```bash
# Backend only
cd todo-api && mvn test

# Frontend only
cd todo-ui && ng test --watch=false --browsers=ChromeHeadless

# Both (via parent Maven)
mvn clean verify
```
