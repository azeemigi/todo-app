import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TodoListControlsComponent } from './todo-list-controls.component';

describe('TodoListControlsComponent', () => {
  let fixture: ComponentFixture<TodoListControlsComponent>;
  let component: TodoListControlsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodoListControlsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // T017: Status filter tests
  it('renders All, Active, Completed buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('[data-status]');
    const labels = Array.from(buttons).map((b: any) => b.getAttribute('data-status'));
    expect(labels).toContain('all');
    expect(labels).toContain('active');
    expect(labels).toContain('completed');
  });

  it('clicking All button emits statusChange with "all"', () => {
    const spy = jasmine.createSpy('statusChange');
    component.statusChange.subscribe(spy);
    const btn = fixture.nativeElement.querySelector('[data-status="all"]');
    btn.click();
    expect(spy).toHaveBeenCalledWith('all');
  });

  it('clicking Active button emits statusChange with "active"', () => {
    const spy = jasmine.createSpy('statusChange');
    component.statusChange.subscribe(spy);
    const btn = fixture.nativeElement.querySelector('[data-status="active"]');
    btn.click();
    expect(spy).toHaveBeenCalledWith('active');
  });

  it('clicking Completed button emits statusChange with "completed"', () => {
    const spy = jasmine.createSpy('statusChange');
    component.statusChange.subscribe(spy);
    const btn = fixture.nativeElement.querySelector('[data-status="completed"]');
    btn.click();
    expect(spy).toHaveBeenCalledWith('completed');
  });

  it('button matching currentStatus input has active class', () => {
    fixture.componentRef.setInput('currentStatus', 'active');
    fixture.detectChanges();
    const activeBtn = fixture.nativeElement.querySelector('[data-status="active"]');
    const allBtn = fixture.nativeElement.querySelector('[data-status="all"]');
    expect(activeBtn.classList.contains('active')).toBeTrue();
    expect(allBtn.classList.contains('active')).toBeFalse();
  });

  // T022: Search input tests
  it('renders a search input', () => {
    const input = fixture.nativeElement.querySelector('input[type="text"]');
    expect(input).toBeTruthy();
  });

  it('typing in search input emits searchChange with input value', () => {
    const spy = jasmine.createSpy('searchChange');
    component.searchChange.subscribe(spy);
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="text"]');
    input.value = 'hello';
    input.dispatchEvent(new Event('input'));
    expect(spy).toHaveBeenCalledWith('hello');
  });

  it('clearing search input emits searchChange with empty string', () => {
    const spy = jasmine.createSpy('searchChange');
    component.searchChange.subscribe(spy);
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="text"]');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(spy).toHaveBeenCalledWith('');
  });

  it('search input reflects currentQ input', () => {
    fixture.componentRef.setInput('currentQ', 'report');
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="text"]');
    expect(input.value).toBe('report');
  });

  // T028: Sort selector tests
  it('renders a sort select element', () => {
    const select = fixture.nativeElement.querySelector('select[data-sort]');
    expect(select).toBeTruthy();
  });

  it('selecting Newest emits sortChange with {sortBy:createdAt, sortDir:desc}', () => {
    const spy = jasmine.createSpy('sortChange');
    component.sortChange.subscribe(spy);
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[data-sort]');
    select.value = 'createdAt:desc';
    select.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith({ sortBy: 'createdAt', sortDir: 'desc' });
  });

  it('selecting Oldest emits sortChange with {sortBy:createdAt, sortDir:asc}', () => {
    const spy = jasmine.createSpy('sortChange');
    component.sortChange.subscribe(spy);
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[data-sort]');
    select.value = 'createdAt:asc';
    select.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith({ sortBy: 'createdAt', sortDir: 'asc' });
  });

  it('selecting Title A-Z emits sortChange with {sortBy:title, sortDir:asc}', () => {
    const spy = jasmine.createSpy('sortChange');
    component.sortChange.subscribe(spy);
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[data-sort]');
    select.value = 'title:asc';
    select.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith({ sortBy: 'title', sortDir: 'asc' });
  });

  it('selecting Title Z-A emits sortChange with {sortBy:title, sortDir:desc}', () => {
    const spy = jasmine.createSpy('sortChange');
    component.sortChange.subscribe(spy);
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[data-sort]');
    select.value = 'title:desc';
    select.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith({ sortBy: 'title', sortDir: 'desc' });
  });

  it('sort select reflects currentSortBy and currentSortDir inputs', () => {
    fixture.componentRef.setInput('currentSortBy', 'title');
    fixture.componentRef.setInput('currentSortDir', 'asc');
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[data-sort]');
    expect(select.value).toBe('title:asc');
  });
});
