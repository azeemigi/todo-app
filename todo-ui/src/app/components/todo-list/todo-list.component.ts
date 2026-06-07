import { Component, inject } from '@angular/core';
import { TodoService } from '../../services/todo.service';
import { TodoItemComponent } from '../todo-item/todo-item.component';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [TodoItemComponent],
  template: `
    @if (svc.loading()) {
      <div class="loading-spinner">
        <p>Loading TODOs...</p>
      </div>
    } @else if (svc.error()) {
      <div class="error-message">
        <p>{{ svc.error() }}</p>
        <button (click)="retry()">Retry</button>
      </div>
    } @else if (svc.todos().length === 0) {
      <div class="empty-state">
        <p>No TODOs yet. Create one above!</p>
      </div>
    } @else {
      <div class="todo-list">
        @for (todo of svc.todos(); track todo.id) {
          <app-todo-item [todo]="todo" />
        }
      </div>
    }
  `,
  styles: [`
    .loading-spinner { text-align: center; padding: 2rem; color: #666; }
    .error-message { padding: 1rem; background: #fee; border: 1px solid #fcc; border-radius: 4px; }
    .error-message button { margin-top: 0.5rem; }
    .empty-state { text-align: center; padding: 3rem; color: #888; }
    .todo-list { display: flex; flex-direction: column; gap: 0.75rem; }
  `]
})
export class TodoListComponent {
  protected svc = inject(TodoService);

  retry(): void {
    this.svc.loadTodos();
  }
}
