import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TodoService } from './todo.service';
import { Todo } from '../models/todo.model';

const mockTodo: Todo = {
  id: '1',
  title: 'Test',
  description: null,
  completed: false,
  createdAt: '2026-06-07T10:00:00Z',
  updatedAt: '2026-06-07T10:00:00Z',
  dueDate: null
};

describe('TodoService', () => {
  let service: TodoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TodoService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TodoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch todos via GET /api/todos', () => {
    service.findAll().subscribe(todos => {
      expect(todos).toEqual([mockTodo]);
    });
    const req = httpMock.expectOne('/api/todos');
    expect(req.request.method).toBe('GET');
    req.flush([mockTodo]);
  });

  it('should append status param when filter has status', () => {
    service.findAll({ status: 'active' }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/todos');
    expect(req.request.params.get('status')).toBe('active');
    req.flush([]);
  });

  it('should append q param when filter has non-blank q', () => {
    service.findAll({ status: 'all', q: 'report' }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/todos');
    expect(req.request.params.get('q')).toBe('report');
    req.flush([]);
  });

  it('should omit q param when filter q is empty', () => {
    service.findAll({ q: '' }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/todos');
    expect(req.request.params.has('q')).toBeFalse();
    req.flush([]);
  });

  it('should omit q param when filter q is whitespace-only', () => {
    service.findAll({ q: '  ' }).subscribe();
    const req = httpMock.expectOne(r => r.url === '/api/todos');
    expect(req.request.params.has('q')).toBeFalse();
    req.flush([]);
  });

  it('should send POST to /api/todos when creating a todo', () => {
    service.create({ title: 'New' }).subscribe(todo => {
      expect(todo.title).toBe('Test');
    });
    const req = httpMock.expectOne('/api/todos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'New' });
    req.flush(mockTodo);
  });

  it('should send PUT to /api/todos/{id} when updating a todo', () => {
    service.update('1', { title: 'Updated', completed: false }).subscribe(todo => {
      expect(todo.title).toBe('Test');
    });
    const req = httpMock.expectOne('/api/todos/1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockTodo);
  });

  it('should send PATCH to /api/todos/{id} when patching a todo', () => {
    service.patch('1', true).subscribe();
    const req = httpMock.expectOne('/api/todos/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ completed: true });
    req.flush({ ...mockTodo, completed: true });
  });

  it('should send DELETE to /api/todos/{id} when deleting a todo', () => {
    service.delete('1').subscribe();
    const req = httpMock.expectOne('/api/todos/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
