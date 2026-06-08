import { Component, ChangeDetectionStrategy, DestroyRef, EventEmitter, inject, Input, OnInit, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Todo } from '../../../core/models/todo.model';
import { TodoService } from '../../../core/services/todo.service';

@Component({
  selector: 'app-todo-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()" class="edit-form">
      <div class="field">
        <label for="edit-title">Title <span class="required">*</span></label>
        <input id="edit-title" type="text" formControlName="title" />
        @if (titleCtrl.invalid && titleCtrl.touched) {
          @if (titleCtrl.errors?.['required'] || titleCtrl.errors?.['minlength']) {
            <span class="field-error">Title is required.</span>
          } @else if (titleCtrl.errors?.['maxlength']) {
            <span class="field-error">Title must be 200 characters or fewer.</span>
          }
        }
      </div>
      <div class="field">
        <label for="edit-description">Description</label>
        <textarea id="edit-description" formControlName="description" rows="2"></textarea>
        @if (descCtrl.invalid && descCtrl.touched) {
          <span class="field-error">Description must be 1000 characters or fewer.</span>
        }
      </div>
      <div class="field due-date-field">
        <label for="edit-dueDate">Due Date</label>
        <input id="edit-dueDate" type="date" formControlName="dueDate" />
      </div>
      @if (serverError()) {
        <p class="field-error">{{ serverError() }}</p>
      }
      <div class="edit-actions">
        <button type="submit" [disabled]="saving()">Save</button>
        <button type="button" class="cancel-edit-btn" (click)="cancel()">Cancel</button>
      </div>
    </form>
  `,
  styleUrl: './todo-edit.component.scss'
})
export class TodoEditComponent implements OnInit {
  @Input({ required: true }) todo!: Todo;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly svc = inject(TodoService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    description: ['', Validators.maxLength(1000)],
    dueDate: ['']
  });

  get titleCtrl() { return this.form.controls.title; }
  get descCtrl() { return this.form.controls.description; }

  ngOnInit(): void {
    this.form.patchValue({
      title: this.todo.title,
      description: this.todo.description ?? '',
      dueDate: this.todo.dueDate ?? ''
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { title, description, dueDate } = this.form.getRawValue();
    this.saving.set(true);
    this.serverError.set(null);
    this.svc.update(this.todo.id, {
      title: title!,
      description: description || undefined,
      completed: this.todo.completed,
      dueDate: dueDate || null
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => this.saved.emit(),
      error: () => this.serverError.set('Failed to save changes.')
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
