import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Todo } from '../../models/todo.model';
import { TodoService } from '../../services/todo.service';

@Component({
  selector: 'app-todo-edit',
  standalone: true,
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
      <div class="edit-actions">
        <button type="submit">Save</button>
        <button type="button" class="cancel-edit-btn" (click)="cancel()">Cancel</button>
      </div>
    </form>
  `,
  styles: [`
    .edit-form { border-top: 1px solid #ddd; margin-top: 0.75rem; padding-top: 0.75rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.5rem; }
    label { font-size: 0.8rem; font-weight: 600; }
    input, textarea { border: 1px solid #ccc; border-radius: 4px; padding: 0.4rem; font-size: 0.9rem; }
    .required { color: #c00; }
    .field-error { color: #c00; font-size: 0.75rem; }
    .edit-actions { display: flex; gap: 0.5rem; }
    button[type="submit"] { background: #0070f3; color: #fff; border: none; border-radius: 4px; padding: 0.4rem 1rem; cursor: pointer; }
    .cancel-edit-btn { background: #eee; border: none; border-radius: 4px; padding: 0.4rem 1rem; cursor: pointer; }
  `]
})
export class TodoEditComponent implements OnInit {
  @Input({ required: true }) todo!: Todo;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private svc = inject(TodoService);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    description: ['', Validators.maxLength(1000)]
  });

  get titleCtrl() { return this.form.controls.title; }
  get descCtrl() { return this.form.controls.description; }

  ngOnInit(): void {
    this.form.patchValue({ title: this.todo.title, description: this.todo.description ?? '' });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { title, description } = this.form.getRawValue();
    this.svc.updateTodo(this.todo.id, {
      title: title!,
      description: description || undefined,
      completed: this.todo.completed
    });
    this.saved.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
