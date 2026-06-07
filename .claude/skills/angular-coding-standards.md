# Skill: Angular UI Coding Standards

**Scope:** All Angular source code in `todo-ui/src/`
**Stack:** Angular 22, TypeScript, standalone components, signals

---

## Project Structure

```
todo-ui/src/
├── app/
│   ├── core/                    # Singleton services, interceptors, guards
│   │   ├── services/
│   │   │   └── todo.service.ts
│   │   ├── interceptors/
│   │   │   └── error.interceptor.ts
│   │   └── models/
│   │       └── todo.model.ts
│   ├── features/                # Feature-based folders
│   │   └── todo/
│   │       ├── todo-list/
│   │       │   ├── todo-list.component.ts
│   │       │   ├── todo-list.component.html
│   │       │   ├── todo-list.component.scss
│   │       │   └── todo-list.component.spec.ts
│   │       ├── todo-form/
│   │       │   └── ...
│   │       └── todo-item/
│   │           └── ...
│   ├── shared/                  # Reusable components, pipes, directives
│   │   ├── components/
│   │   ├── pipes/
│   │   └── directives/
│   ├── app.component.ts
│   ├── app.component.html
│   ├── app.component.scss
│   ├── app.component.spec.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── environments/
│   ├── environment.ts
│   └── environment.development.ts
├── styles.scss
└── index.html
```

### Rules
- Group by feature, not by type (no top-level `components/`, `services/`, `pipes/` folders)
- One component per file. One service per file. One model per file
- Co-locate test files: `todo-list.component.spec.ts` next to `todo-list.component.ts`
- Core services (singletons) go in `core/services/`
- Shared/reusable UI components go in `shared/components/`

---

## Standalone Components (Angular 22 Default)

All components must be standalone. No NgModules unless forced by a third-party library.

```typescript
// Good -- standalone component with explicit imports
@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, TodoItemComponent, TodoFormComponent],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoListComponent {
  // ...
}

// Bad -- NgModule-based component
@NgModule({
  declarations: [TodoListComponent],
  imports: [CommonModule],
})
export class TodoModule {} // Do not create feature modules
```

---

## Signals (Angular 22 Stable)

Use signals for component state. Prefer signals over BehaviorSubject for local state management.

```typescript
// Good -- signal-based state
export class TodoListComponent {
  private readonly todoService = inject(TodoService);

  todos = signal<Todo[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  filter = signal<'all' | 'active' | 'completed'>('all');

  // Computed signal for filtered view
  filteredTodos = computed(() => {
    const todos = this.todos();
    const filter = this.filter();
    return switch (filter) {
      case 'active': return todos.filter(t => !t.completed);
      case 'completed': return todos.filter(t => t.completed);
      default: return todos;
    };
  });

  completedCount = computed(() =>
    this.todos().filter(t => t.completed).length
  );
}
```

### Signal Rules
- Use `signal()` for writable state owned by the component
- Use `computed()` for derived state
- Use `effect()` sparingly -- only for side effects that must react to signal changes (e.g. logging, localStorage sync)
- Do NOT use signals to replace RxJS for HTTP calls. `HttpClient` returns Observables -- that is fine
- Convert HTTP Observables to signals in the service or component using `toSignal()` where appropriate

---

## Change Detection

Every component must use `OnPush` change detection.

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

With signals and OnPush, Angular only re-renders when signal values actually change. This is the Angular 22 default for new components but must be explicitly set.

---

## Dependency Injection

Use the `inject()` function (Angular 14+), not constructor injection.

```typescript
// Good -- inject() function
export class TodoListComponent {
  private readonly todoService = inject(TodoService);
  private readonly router = inject(Router);
}

// Acceptable but verbose -- constructor injection
export class TodoListComponent {
  constructor(
    private readonly todoService: TodoService,
    private readonly router: Router,
  ) {}
}
```

---

## Services

```typescript
// Service pattern -- providedIn: 'root' for singletons
@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/todos';

  findAll(): Observable<Todo[]> {
    return this.http.get<Todo[]>(this.apiUrl);
  }

  findById(id: string): Observable<Todo> {
    return this.http.get<Todo>(`${this.apiUrl}/${id}`);
  }

  create(request: CreateTodoRequest): Observable<Todo> {
    return this.http.post<Todo>(this.apiUrl, request);
  }

  update(id: string, request: UpdateTodoRequest): Observable<Todo> {
    return this.http.put<Todo>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
```

### Rules
- Services handle HTTP calls and business logic. Components handle presentation
- Never call `HttpClient` directly from a component
- Return `Observable<T>` from service methods (do not subscribe inside the service)
- Use relative API URLs (`/api/todos`) -- the proxy config or static deployment handles routing

---

## Models / Interfaces

Define TypeScript interfaces for all data shapes. Use interfaces, not classes, for data models.

```typescript
// core/models/todo.model.ts
export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;   // ISO 8601 from the API
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
}

export interface UpdateTodoRequest {
  title: string;
  description?: string;
  completed: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
}
```

### Rules
- Interfaces for data shapes (no methods, no instantiation needed)
- Classes only when you need methods, constructors, or `instanceof` checks
- Export all model interfaces from a barrel file if the models folder grows: `core/models/index.ts`

---

## Forms

Use reactive forms with typed form controls.

```typescript
export class TodoFormComponent {
  private readonly fb = inject(FormBuilder);

  todoForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(1000)]],
  });

  onSubmit(): void {
    if (this.todoForm.invalid) {
      this.todoForm.markAllAsTouched();
      return;
    }
    const request: CreateTodoRequest = this.todoForm.getRawValue();
    // emit or call service
  }
}
```

### Rules
- Always use `nonNullable` form builder for strict typing
- Validate on submit, show errors after `markAllAsTouched()`
- Display validation messages in the template next to each field
- Reset the form after successful submission

---

## Template Standards

```html
<!-- Use @if / @for (Angular 22 control flow, not *ngIf / *ngFor) -->
@if (loading()) {
  <div class="loading-spinner">Loading...</div>
}

@if (error(); as errorMsg) {
  <div class="error-banner" role="alert">{{ errorMsg }}</div>
}

@for (todo of filteredTodos(); track todo.id) {
  <app-todo-item
    [todo]="todo"
    (toggled)="onToggle($event)"
    (deleted)="onDelete($event)"
  />
} @empty {
  <p class="empty-state">No TODOs yet. Create one above.</p>
}
```

### Rules
- Use Angular 22 built-in control flow (`@if`, `@for`, `@switch`) instead of structural directives (`*ngIf`, `*ngFor`)
- Always provide `track` in `@for` loops (use a unique identifier like `todo.id`)
- Use `@empty` block for empty state messaging
- Keep templates lean -- extract complex logic into computed signals or helper methods in the component
- Use semantic HTML (`<main>`, `<section>`, `<article>`, `<button>`, `<form>`)
- Add `role` and `aria-*` attributes for accessibility on interactive elements
- Self-close components without children: `<app-todo-item />`

---

## Styling

- Use SCSS (Angular default with `--style=scss`)
- Component styles are scoped (Angular's ViewEncapsulation.Emulated by default)
- Use CSS custom properties (variables) for theming in `styles.scss`
- Mobile-first responsive design: write base styles for mobile, add `@media` queries for larger screens
- No inline styles in templates
- No `!important` unless overriding a third-party library

---

## Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Component file | kebab-case | `todo-list.component.ts` |
| Component class | PascalCase | `TodoListComponent` |
| Component selector | `app-` prefix, kebab-case | `app-todo-list` |
| Service file | kebab-case | `todo.service.ts` |
| Service class | PascalCase | `TodoService` |
| Model file | kebab-case | `todo.model.ts` |
| Interface | PascalCase (no `I` prefix) | `Todo`, `CreateTodoRequest` |
| Signal | camelCase, noun | `todos`, `loading`, `error` |
| Computed signal | camelCase, noun | `filteredTodos`, `completedCount` |
| Event emitter | camelCase, past tense | `toggled`, `deleted`, `submitted` |
| Method (event handler) | `on` + event | `onToggle()`, `onDelete()` |

---

## Anti-Patterns to Avoid

- **Subscribe in component, forget to unsubscribe**: use `takeUntilDestroyed()` or `toSignal()` or `async` pipe
- **Logic in templates**: move calculations to computed signals or component methods
- **Massive components**: if a component exceeds 150 lines of TypeScript, split it
- **Any type**: never use `any`. Use `unknown` and narrow with type guards if the type is truly uncertain
- **Barrel files everywhere**: only create `index.ts` barrel files for `core/models/` and `shared/`. Do not barrel feature folders
- **Direct DOM manipulation**: no `document.querySelector`. Use `@ViewChild` with `ElementRef` if absolutely necessary
