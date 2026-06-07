import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TodoService } from '../../services/todo.service';

@Component({
  selector: 'app-todo-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="todo-form">
      <h2>New TODO</h2>
      <div class="field">
        <label for="title">Title <span class="required">*</span></label>
        <input id="title" type="text" formControlName="title" placeholder="What needs to be done?" />
        @if (titleCtrl.invalid && titleCtrl.touched) {
          @if (titleCtrl.errors?.['required'] || titleCtrl.errors?.['minlength']) {
            <span class="field-error">Title is required.</span>
          } @else if (titleCtrl.errors?.['maxlength']) {
            <span class="field-error">Title must be 200 characters or fewer.</span>
          }
        }
      </div>
      <div class="field">
        <label for="description">Description</label>
        <textarea id="description" formControlName="description" rows="2" placeholder="Optional details..."></textarea>
        @if (descCtrl.invalid && descCtrl.touched) {
          <span class="field-error">Description must be 1000 characters or fewer.</span>
        }
      </div>
      @if (serverError()) {
        <p class="server-error">{{ serverError() }}</p>
      }
      <button type="submit">Add TODO</button>
    </form>
  `,
  styles: [`
    .todo-form { border: 1px solid #ddd; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem; }
    .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; }
    label { font-weight: 600; font-size: 0.875rem; }
    input, textarea { border: 1px solid #ccc; border-radius: 4px; padding: 0.5rem; font-size: 0.9rem; }
    .required { color: #c00; }
    .field-error { color: #c00; font-size: 0.8rem; }
    .server-error { color: #c00; }
    button[type="submit"] { padding: 0.5rem 1.25rem; background: #0070f3; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
  `]
})
export class TodoFormComponent {
  private svc = inject(TodoService);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    description: ['', Validators.maxLength(1000)]
  });

  get titleCtrl() { return this.form.controls.title; }
  get descCtrl() { return this.form.controls.description; }
  get serverError() { return this.svc.error; }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { title, description } = this.form.getRawValue();
    this.svc.createTodo({ title: title!, description: description || undefined });
    this.form.reset();
  }
}
