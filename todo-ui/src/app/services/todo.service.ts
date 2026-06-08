import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Todo, CreateTodoDto, UpdateTodoDto, PatchTodoDto, TodoFilter } from '../models/todo.model';

@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly API = '/api/todos';

  private todosSignal = signal<Todo[]>([]);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  readonly todos = computed(() => this.todosSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  private requestGen = 0;
  private lastFilter: TodoFilter | undefined;

  constructor(private http: HttpClient) {}

  loadTodos(filter?: TodoFilter): void {
    this.lastFilter = filter;
    const gen = ++this.requestGen;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    let params = new HttpParams();
    if (filter?.status) {
      params = params.set('status', filter.status);
    }
    if (filter?.q && filter.q.trim()) {
      params = params.set('q', filter.q);
    }
    if (filter?.sortBy) {
      params = params.set('sortBy', filter.sortBy);
    }
    if (filter?.sortDir) {
      params = params.set('sortDir', filter.sortDir);
    }

    this.http.get<Todo[]>(this.API, { params }).subscribe({
      next: todos => {
        if (gen !== this.requestGen) return;
        this.todosSignal.set(todos);
        this.loadingSignal.set(false);
      },
      error: () => {
        if (gen !== this.requestGen) return;
        this.errorSignal.set('Failed to load TODOs. Please try again.');
        this.loadingSignal.set(false);
      }
    });
  }

  createTodo(dto: CreateTodoDto): void {
    this.errorSignal.set(null);
    this.http.post<Todo>(this.API, dto).subscribe({
      next: todo => {
        this.todosSignal.update(list => [todo, ...list]);
        this.loadTodos(this.lastFilter);
      },
      error: () => this.errorSignal.set('Failed to create TODO.')
    });
  }

  updateTodo(id: string, dto: UpdateTodoDto): void {
    this.errorSignal.set(null);
    this.http.put<Todo>(`${this.API}/${id}`, dto).subscribe({
      next: updated => {
        this.todosSignal.update(list => list.map(t => t.id === id ? updated : t));
        this.loadTodos(this.lastFilter);
      },
      error: () => this.errorSignal.set('Failed to update TODO.')
    });
  }

  patchTodo(id: string, completed: boolean): void {
    this.errorSignal.set(null);
    const patch: PatchTodoDto = { completed };
    this.http.patch<Todo>(`${this.API}/${id}`, patch).subscribe({
      next: updated => {
        this.todosSignal.update(list => list.map(t => t.id === id ? updated : t));
        this.loadTodos(this.lastFilter);
      },
      error: () => this.errorSignal.set('Failed to update TODO status.')
    });
  }

  deleteTodo(id: string): void {
    this.errorSignal.set(null);
    this.http.delete(`${this.API}/${id}`).subscribe({
      next: () => {
        this.todosSignal.update(list => list.filter(t => t.id !== id));
        this.loadTodos(this.lastFilter);
      },
      error: () => this.errorSignal.set('Failed to delete TODO.')
    });
  }
}
