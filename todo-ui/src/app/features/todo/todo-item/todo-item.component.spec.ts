import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TodoItemComponent } from './todo-item.component';
import { TodoService } from '../../../core/services/todo.service';
import { Todo } from '../../../core/models/todo.model';

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
    mockService = jasmine.createSpyObj('TodoService', ['patch', 'delete']);
    mockService.patch.and.returnValue(of({ ...baseTodo, completed: true }));
    mockService.delete.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [TodoItemComponent],
      providers: [{ provide: TodoService, useValue: mockService }]
    }).compileComponents();
  });

  it('should render the todo title', () => {
    setup(baseTodo);
    expect(fixture.nativeElement.textContent).toContain('My Todo');
  });

  it('should show description when present', () => {
    setup(baseTodo);
    const desc = fixture.nativeElement.querySelector('.todo-description');
    expect(desc).toBeTruthy();
    expect(desc.textContent).toContain('A description');
  });

  it('should hide description when null', () => {
    setup({ ...baseTodo, description: null });
    expect(fixture.nativeElement.querySelector('.todo-description')).toBeNull();
  });

  it('should show the creation date', () => {
    setup(baseTodo);
    expect(fixture.nativeElement.querySelector('.todo-date')).toBeTruthy();
  });

  it('should apply completed CSS class when completed is true', () => {
    setup({ ...baseTodo, completed: true });
    expect(fixture.nativeElement.querySelector('.todo-card.completed')).toBeTruthy();
  });

  it('should not apply completed CSS class when completed is false', () => {
    setup({ ...baseTodo, completed: false });
    expect(fixture.nativeElement.querySelector('.todo-card.completed')).toBeNull();
  });

  it('should call service patch and emit reloaded when checkbox is clicked', () => {
    setup(baseTodo);
    let reloaded = false;
    fixture.componentInstance.reloaded.subscribe(() => { reloaded = true; });
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.click();
    expect(mockService.patch).toHaveBeenCalledWith('1', true);
    expect(reloaded).toBeTrue();
  });

  it('should show error message when patch fails', () => {
    mockService.patch.and.returnValue(throwError(() => new Error('500')));
    setup(baseTodo);
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.item-error')).toBeTruthy();
  });

  it('should show delete confirmation dialog when delete button clicked', () => {
    setup(baseTodo);
    fixture.nativeElement.querySelector('.delete-btn').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.confirm-delete')).toBeTruthy();
  });

  it('should hide confirmation dialog when cancel is clicked', () => {
    setup(baseTodo);
    fixture.nativeElement.querySelector('.delete-btn').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.cancel-delete-btn').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.confirm-delete')).toBeNull();
  });

  it('should call service delete and emit reloaded when confirm delete is clicked', () => {
    setup(baseTodo);
    let reloaded = false;
    fixture.componentInstance.reloaded.subscribe(() => { reloaded = true; });
    fixture.nativeElement.querySelector('.delete-btn').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.confirm-delete-btn').click();
    expect(mockService.delete).toHaveBeenCalledWith('1');
    expect(reloaded).toBeTrue();
  });
});
