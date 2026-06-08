import { Component, ChangeDetectionStrategy, DestroyRef, EventEmitter, inject, Input, Output, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Todo } from '../../../core/models/todo.model';
import { TodoService } from '../../../core/services/todo.service';
import { TodoEditComponent } from '../todo-edit/todo-edit.component';
import { DueDatePipe } from '../../../shared/pipes/due-date.pipe';

@Component({
  selector: 'app-todo-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TodoEditComponent, DueDatePipe],
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
          @if (dueStatus() !== 'none') {
            <span [class]="'due-badge due-' + dueStatus()">
              @if (dueStatus() === 'overdue') { Overdue }
              @else if (dueStatus() === 'due-today') { Due today }
              @else { {{ todo.dueDate | dueDate }} }
            </span>
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
          (saved)="onSaved()"
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
  styleUrl: './todo-item.component.scss'
})
export class TodoItemComponent {
  @Input({ required: true }) todo!: Todo;
  @Output() reloaded = new EventEmitter<void>();

  private readonly svc = inject(TodoService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly today = new Date().toISOString().slice(0, 10);

  readonly toggling = signal(false);
  readonly editing = signal(false);
  readonly confirming = signal(false);
  readonly itemError = signal<string | null>(null);

  readonly dueStatus = computed((): 'overdue' | 'due-today' | 'future' | 'none' => {
    const due = this.todo.dueDate;
    if (!due || this.todo.completed) return 'none';
    if (due < this.today) return 'overdue';
    if (due === this.today) return 'due-today';
    return 'future';
  });

  get formattedDate(): string {
    return new Date(this.todo.createdAt).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  onToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.toggling.set(true);
    this.itemError.set(null);
    this.svc.patch(this.todo.id, checked).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.toggling.set(false))
    ).subscribe({
      next: () => this.reloaded.emit(),
      error: () => this.itemError.set('Failed to update TODO.')
    });
  }

  onSaved(): void {
    this.editing.set(false);
    this.reloaded.emit();
  }

  onDelete(): void {
    this.confirming.set(false);
    this.svc.delete(this.todo.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.reloaded.emit(),
      error: () => this.itemError.set('Failed to delete TODO.')
    });
  }
}
