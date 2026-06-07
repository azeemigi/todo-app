import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TodoItemComponent } from './todo-item.component';
import { TodoService } from '../../services/todo.service';
import { Todo } from '../../models/todo.model';

const baseTodo: Todo = {
  id: '1',
  title: 'My Todo',
  description: 'A description',
  completed: false,
  createdAt: '2026-06-07T10:00:00Z',
  updatedAt: '2026-06-07T10:00:00Z'
};

describe('TodoItemComponent', () => {
  let fixture: ComponentFixture<TodoItemComponent>;
  let mockService: jasmine.SpyObj<TodoService>;

  const setup = (todo: Todo) => {
    fixture = TestBed.createComponent(TodoItemComponent);
    fixture.componentInstance.todo = todo;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('TodoService', ['patchTodo', 'deleteTodo'], {
      error: signal<string | null>(null)
    });

    await TestBed.configureTestingModule({
      imports: [TodoItemComponent],
      providers: [{ provide: TodoService, useValue: mockService }]
    }).compileComponents();
  });

  it('renders title', () => {
    setup(baseTodo);
    expect(fixture.nativeElement.textContent).toContain('My Todo');
  });

  it('shows description when present', () => {
    setup(baseTodo);
    const desc = fixture.nativeElement.querySelector('.todo-description');
    expect(desc).toBeTruthy();
    expect(desc.textContent).toContain('A description');
  });

  it('hides description when null', () => {
    setup({ ...baseTodo, description: null });
    expect(fixture.nativeElement.querySelector('.todo-description')).toBeNull();
  });

  it('shows creation date', () => {
    setup(baseTodo);
    expect(fixture.nativeElement.querySelector('.todo-date')).toBeTruthy();
  });

  it('applies completed CSS class when completed=true', () => {
    setup({ ...baseTodo, completed: true });
    expect(fixture.nativeElement.querySelector('.todo-card.completed')).toBeTruthy();
  });

  it('does not apply completed CSS class when completed=false', () => {
    setup({ ...baseTodo, completed: false });
    expect(fixture.nativeElement.querySelector('.todo-card.completed')).toBeNull();
  });

  // --- Phase 5: Checkbox toggle (US3) ---

  it('clicking checkbox calls todoService.patchTodo() with toggled value', () => {
    setup(baseTodo);
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.click();
    expect(mockService.patchTodo).toHaveBeenCalledWith('1', true);
  });

  // --- Phase 7: Delete (US5) ---

  it('delete button shows confirmation', () => {
    setup(baseTodo);
    const deleteBtn = fixture.nativeElement.querySelector('.delete-btn') as HTMLButtonElement;
    deleteBtn.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.confirm-delete')).toBeTruthy();
  });

  it('cancel keeps card visible', () => {
    setup(baseTodo);
    fixture.nativeElement.querySelector('.delete-btn').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.cancel-delete-btn').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.confirm-delete')).toBeNull();
  });

  it('confirm calls todoService.deleteTodo()', () => {
    setup(baseTodo);
    fixture.nativeElement.querySelector('.delete-btn').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.confirm-delete-btn').click();
    expect(mockService.deleteTodo).toHaveBeenCalledWith('1');
  });
});
