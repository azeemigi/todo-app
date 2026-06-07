import { Component, inject, Input, signal } from '@angular/core';
import { Todo } from '../../models/todo.model';
import { TodoService } from '../../services/todo.service';
import { TodoEditComponent } from '../todo-edit/todo-edit.component';

@Component({
  selector: 'app-todo-item',
  standalone: true,
  imports: [TodoEditComponent],
  template: `
    <div class="todo-card" [class.completed]="todo.completed">
      <div class="todo-main">
        <input
          type="checkbox"
          aria-label="Toggle TODO completion"
          [checked]="todo.completed"
          [disabled]="toggling()"
          (change)="onToggle($event)"
        />
        <div class="todo-content">
          <h3 class="todo-title">{{ todo.title }}</h3>
          @if (todo.description) {
            <p class="todo-description">{{ todo.description }}</p>
          }
          <p class="todo-date">{{ formattedDate }}</p>
        </div>
        <div class="todo-actions">
          <button type="button" class="edit-btn" (click)="editing.set(!editing())">Edit</button>
          <button type="button" class="delete-btn" (click)="confirming.set(true)">Delete</button>
        </div>
      </div>

      @if (editing()) {
        <app-todo-edit
          [todo]="todo"
          (saved)="editing.set(false)"
          (cancelled)="editing.set(false)"
        />
      }

      @if (confirming()) {
        <div class="confirm-delete">
          <span>Delete this TODO?</span>
          <button type="button" class="confirm-delete-btn" (click)="onDelete()">Confirm</button>
          <button type="button" class="cancel-delete-btn" (click)="confirming.set(false)">Cancel</button>
        </div>
      }

      @if (itemError()) {
        <p class="item-error">{{ itemError() }}</p>
      }
    </div>
  `,
  styles: [`
    .todo-card {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 1rem;
      background: #fff;
    }
    .todo-card.completed { background: #f8f8f8; }
    .todo-card.completed .todo-title { text-decoration: line-through; color: #888; }
    .todo-main { display: flex; gap: 0.75rem; align-items: flex-start; }
    .todo-content { flex: 1; }
    .todo-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .todo-title { margin: 0 0 0.25rem; font-size: 1rem; }
    .todo-description { color: #555; font-size: 0.9rem; margin: 0.25rem 0; }
    .todo-date { color: #999; font-size: 0.75rem; margin: 0.5rem 0 0; }
    .todo-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
    .edit-btn, .delete-btn { padding: 0.25rem 0.5rem; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; font-size: 0.8rem; background: #fff; }
    .delete-btn { color: #c00; border-color: #fcc; }
    .confirm-delete { margin-top: 0.75rem; padding: 0.5rem; background: #fff3f3; border-radius: 4px; display: flex; gap: 0.5rem; align-items: center; }
    .confirm-delete-btn { background: #c00; color: #fff; border: none; border-radius: 4px; padding: 0.25rem 0.75rem; cursor: pointer; }
    .cancel-delete-btn { background: #eee; border: none; border-radius: 4px; padding: 0.25rem 0.75rem; cursor: pointer; }
    .item-error { color: #c00; font-size: 0.8rem; margin: 0.5rem 0 0; }
    input[type="checkbox"] { margin-top: 0.2rem; flex-shrink: 0; }
  `]
})
export class TodoItemComponent {
  @Input({ required: true }) todo!: Todo;

  private svc = inject(TodoService);

  toggling = signal(false);
  editing = signal(false);
  confirming = signal(false);
  itemError = signal<string | null>(null);

  get formattedDate(): string {
    return new Date(this.todo.createdAt).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  onToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.toggling.set(true);
    this.itemError.set(null);
    this.svc.patchTodo(this.todo.id, checked);
    this.toggling.set(false);
  }

  onDelete(): void {
    this.svc.deleteTodo(this.todo.id);
    this.confirming.set(false);
  }
}
