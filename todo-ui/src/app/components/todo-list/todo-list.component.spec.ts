import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { convertToParamMap, Router, ActivatedRoute } from '@angular/router';
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

function makeFakeSvc() {
  const todosW = signal<Todo[]>([]);
  const loadingW = signal(false);
  const errorW = signal<string | null>(null);
  return {
    todosW, loadingW, errorW,
    svc: {
      get todos() { return todosW; },
      get loading() { return loadingW; },
      get error() { return errorW; },
      loadTodos: jasmine.createSpy('loadTodos')
    }
  };
}

describe('TodoListComponent — basic rendering', () => {
  let fixture: ComponentFixture<TodoListComponent>;
  let todosW: ReturnType<typeof signal<Todo[]>>;
  let loadingW: ReturnType<typeof signal<boolean>>;
  let errorW: ReturnType<typeof signal<string | null>>;
  let fakeSvc: ReturnType<typeof makeFakeSvc>['svc'];

  beforeEach(async () => {
    const q$ = new BehaviorSubject(convertToParamMap({}));
    const m = makeFakeSvc();
    todosW = m.todosW; loadingW = m.loadingW; errorW = m.errorW; fakeSvc = m.svc;

    await TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [
        { provide: TodoService, useValue: fakeSvc },
        { provide: ActivatedRoute, useValue: { queryParamMap: q$.asObservable() } },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
      ]
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

// T009: URL sync tests
describe('TodoListComponent — URL sync', () => {
  let fixture: ComponentFixture<TodoListComponent>;
  let fakeSvc: ReturnType<typeof makeFakeSvc>['svc'];
  let queryParams$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let fakeRouter: jasmine.SpyObj<Router>;

  async function setup(initialParams: Record<string, string> = {}) {
    const m = makeFakeSvc();
    fakeSvc = m.svc;
    queryParams$ = new BehaviorSubject(convertToParamMap(initialParams));
    fakeRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [
        { provide: TodoService, useValue: fakeSvc },
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParams$.asObservable() } },
        { provide: Router, useValue: fakeRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('on init with no params, loadTodos called with default values', async () => {
    await setup({});
    expect(fakeSvc.loadTodos).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'all', sortBy: 'createdAt', sortDir: 'desc' })
    );
  });

  it('on init with ?status=active, loadTodos called with status=active', async () => {
    await setup({ status: 'active' });
    expect(fakeSvc.loadTodos).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'active' })
    );
  });

  it('on init with ?status=banana (invalid), loadTodos called with status=all (fallback)', async () => {
    await setup({ status: 'banana' });
    expect(fakeSvc.loadTodos).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'all' })
    );
  });

  it('on init with all four params, loadTodos called with all params', async () => {
    await setup({ status: 'active', q: 'report', sortBy: 'title', sortDir: 'asc' });
    expect(fakeSvc.loadTodos).toHaveBeenCalledWith({
      status: 'active', q: 'report', sortBy: 'title', sortDir: 'asc'
    });
  });

  it('on init with ?sortBy=banana (invalid), loadTodos called with sortBy=createdAt (fallback)', async () => {
    await setup({ sortBy: 'banana' });
    expect(fakeSvc.loadTodos).toHaveBeenCalledWith(
      jasmine.objectContaining({ sortBy: 'createdAt' })
    );
  });

  it('updateFilter({status: active}) calls router.navigate with merged queryParams', async () => {
    await setup({});
    (fixture.componentInstance as any).updateFilter({ status: 'active' });
    expect(fakeRouter.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: { status: 'active' },
      queryParamsHandling: 'merge'
    }));
  });

  it('when queryParamMap emits new value, loadTodos called with updated params (back/forward)', async () => {
    await setup({ status: 'all' });
    fakeSvc.loadTodos.calls.reset();

    queryParams$.next(convertToParamMap({ status: 'completed' }));
    fixture.detectChanges();

    expect(fakeSvc.loadTodos).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'completed' })
    );
  });

  // T031: Combined URL hydration
  it('on init with all four params including q, loadTodos called correctly', async () => {
    await setup({ status: 'active', q: 'report', sortBy: 'title', sortDir: 'asc' });
    expect(fakeSvc.loadTodos).toHaveBeenCalledWith({
      status: 'active', q: 'report', sortBy: 'title', sortDir: 'asc'
    });
  });

  // T031: Invalid sortDir falls back
  it('on init with ?sortDir=sideways (invalid), loadTodos called with sortDir=desc (fallback)', async () => {
    await setup({ sortDir: 'sideways' });
    expect(fakeSvc.loadTodos).toHaveBeenCalledWith(
      jasmine.objectContaining({ sortDir: 'desc' })
    );
  });

  // T032: Back/forward navigation drives list state
  it('queryParamMap change → loadTodos called with updated filter, not prior filter', async () => {
    await setup({ status: 'active', q: 'hello' });
    fakeSvc.loadTodos.calls.reset();

    queryParams$.next(convertToParamMap({ status: 'completed', q: 'world' }));
    fixture.detectChanges();

    const calls = fakeSvc.loadTodos.calls.allArgs();
    expect(calls.some((args: any[]) => args[0]?.status === 'completed' && args[0]?.q === 'world')).toBeTrue();
    expect(calls.every((args: any[]) => args[0]?.status !== 'active')).toBeTrue();
  });

  // T036: CRUD reload with filter preserved
  it('retry() calls loadTodos with current filter params', async () => {
    await setup({ status: 'active', q: 'report' });
    fakeSvc.loadTodos.calls.reset();

    fixture.componentInstance.retry();

    expect(fakeSvc.loadTodos).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'active', q: 'report' })
    );
  });

  // T037: Contextual empty state when filter is active
  it('shows no-results message when todos empty and filter is active', async () => {
    await setup({ status: 'active' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.no-results')).toBeTruthy();
  });

  it('shows generic empty-state when todos empty and no filter active', async () => {
    await setup({});
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.empty-state');
    expect(el).toBeTruthy();
    expect(el.querySelector('.no-results')).toBeFalsy();
  });
});
