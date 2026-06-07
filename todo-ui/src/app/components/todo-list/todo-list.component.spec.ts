import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TodoListComponent } from './todo-list.component';
import { TodoService } from '../../services/todo.service';
import { Todo } from '../../models/todo.model';

const mockTodo: Todo = {
  id: '1',
  title: 'Test Todo',
  description: null,
  completed: false,
  createdAt: '2026-06-07T10:00:00Z',
  updatedAt: '2026-06-07T10:00:00Z'
};

describe('TodoListComponent', () => {
  let fixture: ComponentFixture<TodoListComponent>;

  let todosW = signal<Todo[]>([]);
  let loadingW = signal(false);
  let errorW = signal<string | null>(null);

  const fakeSvc = {
    get todos() { return todosW; },
    get loading() { return loadingW; },
    get error() { return errorW; },
    loadTodos: jasmine.createSpy('loadTodos')
  };

  beforeEach(async () => {
    todosW = signal<Todo[]>([]);
    loadingW = signal(false);
    errorW = signal<string | null>(null);
    fakeSvc.loadTodos = jasmine.createSpy('loadTodos');

    await TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [{ provide: TodoService, useValue: fakeSvc }]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
    fixture.detectChanges();
  });

  it('renders empty-state when todos=[]', () => {
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
  });

  it('renders cards when todos populated', () => {
    todosW.set([mockTodo]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-todo-item')).toBeTruthy();
  });

  it('shows loading indicator when loading=true', () => {
    loadingW.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.loading-spinner')).toBeTruthy();
  });

  it('shows error message when error is set', () => {
    errorW.set('Failed to load TODOs');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-message')).toBeTruthy();
  });
});
