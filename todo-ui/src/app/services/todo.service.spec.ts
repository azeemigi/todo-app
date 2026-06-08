import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TodoService } from './todo.service';
import { Todo } from '../models/todo.model';
import { TodoFilter } from '../models/todo.model';

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
    httpMock.expectOne(r => r.url === '/api/todos' && r.method === 'GET').flush([]);

    service.createTodo({ title: 'New', description: undefined });
    const postReq = httpMock.expectOne(r => r.url === '/api/todos' && r.method === 'POST');
    expect(postReq.request.method).toBe('POST');
    postReq.flush(mockTodo);
    // Flush the reload GET triggered by createTodo
    httpMock.expectOne(r => r.url === '/api/todos' && r.method === 'GET').flush([mockTodo]);
    expect(service.todos()).toContain(mockTodo);
  });

  it('patchTodo() calls PATCH /api/todos/{id} and updates signal', () => {
    service['todosSignal'].set([mockTodo]);
    service.patchTodo('1', true);
    const req = httpMock.expectOne('/api/todos/1');
    expect(req.request.method).toBe('PATCH');
    const updated = { ...mockTodo, completed: true };
    req.flush(updated);
    // Flush the reload GET triggered by patchTodo
    httpMock.expectOne(r => r.url === '/api/todos' && r.method === 'GET').flush([updated]);
    expect(service.todos()[0].completed).toBeTrue();
  });

  it('updateTodo() calls PUT /api/todos/{id} and replaces item', () => {
    service['todosSignal'].set([mockTodo]);
    service.updateTodo('1', { title: 'Updated', completed: false });
    const req = httpMock.expectOne('/api/todos/1');
    expect(req.request.method).toBe('PUT');
    const updated = { ...mockTodo, title: 'Updated' };
    req.flush(updated);
    // Flush the reload GET triggered by updateTodo
    httpMock.expectOne(r => r.url === '/api/todos' && r.method === 'GET').flush([updated]);
    expect(service.todos()[0].title).toBe('Updated');
  });

  it('deleteTodo() calls DELETE /api/todos/{id} and removes item', () => {
    service['todosSignal'].set([mockTodo]);
    service.deleteTodo('1');
    const req = httpMock.expectOne('/api/todos/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    // Flush the reload GET triggered by deleteTodo
    httpMock.expectOne(r => r.url === '/api/todos' && r.method === 'GET').flush([]);
    expect(service.todos()).toEqual([]);
  });

  it('sets error signal on loadTodos failure', () => {
    service.loadTodos();
    httpMock.expectOne('/api/todos').flush('error', { status: 500, statusText: 'Server Error' });
    expect(service.error()).toBeTruthy();
  });

  // T006: Filter parameter tests
  it('loadTodos({ status: "active" }) appends status param', () => {
    service.loadTodos({ status: 'active' });
    const req = httpMock.expectOne(r => r.url === '/api/todos');
    expect(req.request.params.get('status')).toBe('active');
    req.flush([mockTodo]);
  });

  it('loadTodos({ status: "all", q: "report" }) appends both params', () => {
    service.loadTodos({ status: 'all', q: 'report' });
    const req = httpMock.expectOne(r => r.url === '/api/todos');
    expect(req.request.params.get('status')).toBe('all');
    expect(req.request.params.get('q')).toBe('report');
    req.flush([]);
  });

  it('loadTodos({ q: "" }) omits q param', () => {
    service.loadTodos({ q: '' });
    const req = httpMock.expectOne(r => r.url === '/api/todos');
    expect(req.request.params.has('q')).toBeFalse();
    req.flush([]);
  });

  it('loadTodos({ q: "  " }) omits q param when whitespace-only', () => {
    service.loadTodos({ q: '  ' });
    const req = httpMock.expectOne(r => r.url === '/api/todos');
    expect(req.request.params.has('q')).toBeFalse();
    req.flush([]);
  });

  it('generation counter: first response discarded when second loadTodos fires first', () => {
    const todo1: Todo = { ...mockTodo, title: 'First' };
    const todo2: Todo = { ...mockTodo, title: 'Second' };

    service.loadTodos({ q: 'r' });
    service.loadTodos({ q: 'report' });

    const reqs = httpMock.match(r => r.url === '/api/todos');
    expect(reqs.length).toBe(2);

    // Flush first (stale) response — should be discarded
    reqs[0].flush([todo1]);
    expect(service.todos().map(t => t.title)).not.toContain('First');

    // Flush second response — should be applied
    reqs[1].flush([todo2]);
    expect(service.todos()[0].title).toBe('Second');
  });

  it('error during superseded request is discarded by generation counter', () => {
    service.loadTodos({ q: 'r' });
    service.loadTodos({ q: 'report' });

    const reqs = httpMock.match(r => r.url === '/api/todos');
    // First request errors — should be ignored (stale)
    reqs[0].flush('error', { status: 500, statusText: 'Server Error' });
    expect(service.error()).toBeNull();

    // Second succeeds
    reqs[1].flush([mockTodo]);
    expect(service.todos()).toEqual([mockTodo]);
  });
});
