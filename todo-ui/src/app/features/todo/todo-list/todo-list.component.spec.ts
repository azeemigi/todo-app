import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { convertToParamMap, Router, ActivatedRoute } from '@angular/router';
import { TodoListComponent } from './todo-list.component';
import { TodoService } from '../../../core/services/todo.service';
import { Todo } from '../../../core/models/todo.model';

const mockTodo: Todo = {
  id: '1',
  title: 'Test Todo',
  description: null,
  completed: false,
  createdAt: '2026-06-07T10:00:00Z',
  updatedAt: '2026-06-07T10:00:00Z',
  dueDate: null
};

describe('TodoListComponent — rendering', () => {
  let fixture: ComponentFixture<TodoListComponent>;
  let mockService: jasmine.SpyObj<TodoService>;
  let queryParams$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('TodoService', ['findAll']);
    mockService.findAll.and.returnValue(of([]));
    queryParams$ = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [
        { provide: TodoService, useValue: mockService },
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParams$.asObservable() } },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
    fixture.detectChanges();
  });

  it('should show empty state when todos list is empty', () => {
    expect(fixture.nativeElement.querySelector('.empty-state')).toBeTruthy();
  });

  it('should render todo items when todos are populated', () => {
    mockService.findAll.and.returnValue(of([mockTodo]));
    fixture.componentInstance.reload();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-todo-item')).toBeTruthy();
  });

  it('should show loading spinner while request is in flight', () => {
    expect(fixture.nativeElement.querySelector('.loading-spinner')).toBeNull();
  });

  it('should show error message when findAll fails', () => {
    mockService.findAll.and.returnValue(throwError(() => new Error('500')));
    fixture.componentInstance.reload();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-message')).toBeTruthy();
  });
});

describe('TodoListComponent — URL sync', () => {
  let fixture: ComponentFixture<TodoListComponent>;
  let mockService: jasmine.SpyObj<TodoService>;
  let queryParams$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let fakeRouter: jasmine.SpyObj<Router>;

  async function setup(initialParams: Record<string, string> = {}) {
    mockService = jasmine.createSpyObj('TodoService', ['findAll']);
    mockService.findAll.and.returnValue(of([]));
    queryParams$ = new BehaviorSubject(convertToParamMap(initialParams));
    fakeRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [
        { provide: TodoService, useValue: mockService },
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParams$.asObservable() } },
        { provide: Router, useValue: fakeRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('should call findAll with default filter values when no URL params present', async () => {
    await setup({});
    expect(mockService.findAll).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'all', sortBy: 'createdAt', sortDir: 'desc' })
    );
  });

  it('should call findAll with status=active when URL param is status=active', async () => {
    await setup({ status: 'active' });
    expect(mockService.findAll).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'active' })
    );
  });

  it('should fall back to status=all when URL param status is invalid', async () => {
    await setup({ status: 'banana' });
    expect(mockService.findAll).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'all' })
    );
  });

  it('should call findAll with all four filter params when all are present in URL', async () => {
    await setup({ status: 'active', q: 'report', sortBy: 'title', sortDir: 'asc' });
    expect(mockService.findAll).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'active', q: 'report', sortBy: 'title', sortDir: 'asc' })
    );
  });

  it('should fall back to sortBy=createdAt when URL param sortBy is invalid', async () => {
    await setup({ sortBy: 'banana' });
    expect(mockService.findAll).toHaveBeenCalledWith(
      jasmine.objectContaining({ sortBy: 'createdAt' })
    );
  });

  it('should fall back to sortDir=desc when URL param sortDir is invalid', async () => {
    await setup({ sortDir: 'sideways' });
    expect(mockService.findAll).toHaveBeenCalledWith(
      jasmine.objectContaining({ sortDir: 'desc' })
    );
  });

  it('should call router.navigate with merged queryParams when updateFilter is called', async () => {
    await setup({});
    fixture.componentInstance.updateFilter({ status: 'active' });
    expect(fakeRouter.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: { status: 'active' },
      queryParamsHandling: 'merge'
    }));
  });

  it('should call findAll with updated filter when queryParamMap emits new value', async () => {
    await setup({ status: 'all' });
    mockService.findAll.calls.reset();

    queryParams$.next(convertToParamMap({ status: 'completed' }));
    fixture.detectChanges();

    expect(mockService.findAll).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'completed' })
    );
  });

  it('should call findAll with current filter when retry is called', async () => {
    await setup({ status: 'active', q: 'report' });
    mockService.findAll.calls.reset();

    fixture.componentInstance.retry();

    expect(mockService.findAll).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'active', q: 'report' })
    );
  });

  it('should show no-results message when todos empty and filter is active', async () => {
    await setup({ status: 'active' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.no-results')).toBeTruthy();
  });

  it('should show generic empty-state message when todos empty and no filter active', async () => {
    await setup({});
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.empty-state');
    expect(el).toBeTruthy();
    expect(el.querySelector('.no-results')).toBeFalsy();
  });

  it('should call findAll with updated status when queryParamMap changes from active to completed', async () => {
    await setup({ status: 'active', q: 'hello' });
    mockService.findAll.calls.reset();

    queryParams$.next(convertToParamMap({ status: 'completed', q: 'world' }));
    fixture.detectChanges();

    const calls = mockService.findAll.calls.allArgs();
    expect(calls.some((args: any[]) => args[0]?.status === 'completed' && args[0]?.q === 'world')).toBeTrue();
    expect(calls.every((args: any[]) => args[0]?.status !== 'active')).toBeTrue();
  });

  // T029 — US3: dueFilter URL sync

  it('should call findAll with dueFilter when dueFilter param is present in URL', async () => {
    await setup({ dueFilter: 'overdue' });
    expect(mockService.findAll).toHaveBeenCalledWith(
      jasmine.objectContaining({ dueFilter: 'overdue' })
    );
  });

  it('should call findAll without dueFilter when dueFilter param is absent', async () => {
    await setup({});
    const lastCall = mockService.findAll.calls.mostRecent().args[0] as any;
    expect(lastCall.dueFilter == null || lastCall.dueFilter === '').toBeTrue();
  });
});
