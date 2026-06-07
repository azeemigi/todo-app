import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TodoEditComponent } from './todo-edit.component';
import { TodoService } from '../../services/todo.service';
import { Todo } from '../../models/todo.model';

const testTodo: Todo = {
  id: '42',
  title: 'Original title',
  description: 'Original desc',
  completed: false,
  createdAt: '2026-06-07T10:00:00Z',
  updatedAt: '2026-06-07T10:00:00Z'
};

describe('TodoEditComponent', () => {
  let fixture: ComponentFixture<TodoEditComponent>;
  let mockService: jasmine.SpyObj<TodoService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('TodoService', ['updateTodo'], {
      error: signal<string | null>(null)
    });

    await TestBed.configureTestingModule({
      imports: [TodoEditComponent, ReactiveFormsModule],
      providers: [{ provide: TodoService, useValue: mockService }]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoEditComponent);
    fixture.componentInstance.todo = testTodo;
    fixture.detectChanges();
  });

  const titleInput = () => fixture.nativeElement.querySelector('input[formControlName="title"]') as HTMLInputElement;
  const saveBtn = () => fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
  const cancelBtn = () => fixture.nativeElement.querySelector('.cancel-edit-btn') as HTMLButtonElement;

  it('form is pre-populated with current title and description', () => {
    expect(titleInput().value).toBe('Original title');
  });

  it('save calls todoService.updateTodo()', () => {
    saveBtn().click();
    expect(mockService.updateTodo).toHaveBeenCalledWith('42', jasmine.objectContaining({ title: 'Original title' }));
  });

  it('blank title shows validation error and blocks save', () => {
    titleInput().value = '';
    titleInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    saveBtn().click();
    fixture.detectChanges();
    expect(mockService.updateTodo).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.field-error')).toBeTruthy();
  });

  it('cancel emits close event without API call', () => {
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => { cancelled = true; });
    cancelBtn().click();
    expect(cancelled).toBeTrue();
    expect(mockService.updateTodo).not.toHaveBeenCalled();
  });
});
