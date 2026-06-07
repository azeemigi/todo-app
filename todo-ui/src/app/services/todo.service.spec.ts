import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TodoService } from './todo.service';
import { Todo } from '../models/todo.model';

const mockTodo: Todo = {
  id: '1',
  title: 'Test',
  description: null,
  completed: false,
  createdAt: '2026-06-07T10:00:00Z',
  updatedAt: '2026-06-07T10:00:00Z'
};

describe('TodoService', () => {
  let service: TodoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TodoService]
    });
    service = TestBed.inject(TodoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('loadTodos() calls GET /api/todos and sets todos signal', () => {
    service.loadTodos();
    const req = httpMock.expectOne('/api/todos');
    expect(req.request.method).toBe('GET');
    req.flush([mockTodo]);
    expect(service.todos()).toEqual([mockTodo]);
  });

  it('createTodo() calls POST /api/todos and prepends result', () => {
    service.loadTodos();
    httpMock.expectOne('/api/todos').flush([]);

    service.createTodo({ title: 'New', description: undefined });
    const req = httpMock.expectOne('/api/todos');
    expect(req.request.method).toBe('POST');
    req.flush(mockTodo);
    expect(service.todos()).toContain(mockTodo);
  });

  it('patchTodo() calls PATCH /api/todos/{id} and updates signal', () => {
    service['todosSignal'].set([mockTodo]);
    service.patchTodo('1', true);
    const req = httpMock.expectOne('/api/todos/1');
    expect(req.request.method).toBe('PATCH');
    const updated = { ...mockTodo, completed: true };
    req.flush(updated);
    expect(service.todos()[0].completed).toBeTrue();
  });

  it('updateTodo() calls PUT /api/todos/{id} and replaces item', () => {
    service['todosSignal'].set([mockTodo]);
    service.updateTodo('1', { title: 'Updated', completed: false });
    const req = httpMock.expectOne('/api/todos/1');
    expect(req.request.method).toBe('PUT');
    const updated = { ...mockTodo, title: 'Updated' };
    req.flush(updated);
    expect(service.todos()[0].title).toBe('Updated');
  });

  it('deleteTodo() calls DELETE /api/todos/{id} and removes item', () => {
    service['todosSignal'].set([mockTodo]);
    service.deleteTodo('1');
    const req = httpMock.expectOne('/api/todos/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(service.todos()).toEqual([]);
  });

  it('sets error signal on loadTodos failure', () => {
    service.loadTodos();
    httpMock.expectOne('/api/todos').flush('error', { status: 500, statusText: 'Server Error' });
    expect(service.error()).toBeTruthy();
  });
});
