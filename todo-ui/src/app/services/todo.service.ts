import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Todo, CreateTodoDto, UpdateTodoDto, PatchTodoDto } from '../models/todo.model';

@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly API = '/api/todos';

  private todosSignal = signal<Todo[]>([]);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  readonly todos = computed(() => this.todosSignal());
  readonly loading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  constructor(private http: HttpClient) {}

  loadTodos(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.http.get<Todo[]>(this.API).subscribe({
      next: todos => {
        this.todosSignal.set(todos);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.errorSignal.set('Failed to load TODOs. Please try again.');
        this.loadingSignal.set(false);
      }
    });
  }

  createTodo(dto: CreateTodoDto): void {
    this.http.post<Todo>(this.API, dto).subscribe({
      next: todo => this.todosSignal.update(list => [todo, ...list]),
      error: () => this.errorSignal.set('Failed to create TODO.')
    });
  }

  updateTodo(id: string, dto: UpdateTodoDto): void {
    this.http.put<Todo>(`${this.API}/${id}`, dto).subscribe({
      next: updated => this.todosSignal.update(list =>
        list.map(t => t.id === id ? updated : t)
      )
    });
  }

  patchTodo(id: string, completed: boolean): void {
    const patch: PatchTodoDto = { completed };
    this.http.patch<Todo>(`${this.API}/${id}`, patch).subscribe({
      next: updated => this.todosSignal.update(list =>
        list.map(t => t.id === id ? updated : t)
      )
    });
  }

  deleteTodo(id: string): void {
    this.http.delete(`${this.API}/${id}`).subscribe({
      next: () => this.todosSignal.update(list => list.filter(t => t.id !== id))
    });
  }
}
