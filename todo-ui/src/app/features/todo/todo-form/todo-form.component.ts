import { Component, ChangeDetectionStrategy, DestroyRef, EventEmitter, inject, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { TodoService } from '../../../core/services/todo.service';

@Component({
  selector: 'app-todo-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      <button type="submit" [disabled]="submitting()">Add TODO</button>
    </form>
  `,
  styleUrl: './todo-form.component.scss'
})
export class TodoFormComponent {
  @Output() created = new EventEmitter<void>();

  private readonly svc = inject(TodoService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    description: ['', Validators.maxLength(1000)]
  });

  get titleCtrl() { return this.form.controls.title; }
  get descCtrl() { return this.form.controls.description; }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { title, description } = this.form.getRawValue();
    this.submitting.set(true);
    this.serverError.set(null);
    this.svc.create({ title: title!, description: description || undefined }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submitting.set(false))
    ).subscribe({
      next: () => {
        this.form.reset();
        this.created.emit();
      },
      error: () => this.serverError.set('Failed to create TODO.')
    });
  }
}
