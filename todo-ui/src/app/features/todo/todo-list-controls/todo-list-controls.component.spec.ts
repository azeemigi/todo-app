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

  it('should render All, Active, Completed buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('[data-status]');
    const labels = Array.from(buttons).map((b: any) => b.getAttribute('data-status'));
    expect(labels).toContain('all');
    expect(labels).toContain('active');
    expect(labels).toContain('completed');
  });

  it('should emit statusChange with "all" when All button clicked', () => {
    const spy = jasmine.createSpy('statusChange');
    component.statusChange.subscribe(spy);
    fixture.nativeElement.querySelector('[data-status="all"]').click();
    expect(spy).toHaveBeenCalledWith('all');
  });

  it('should emit statusChange with "active" when Active button clicked', () => {
    const spy = jasmine.createSpy('statusChange');
    component.statusChange.subscribe(spy);
    fixture.nativeElement.querySelector('[data-status="active"]').click();
    expect(spy).toHaveBeenCalledWith('active');
  });

  it('should emit statusChange with "completed" when Completed button clicked', () => {
    const spy = jasmine.createSpy('statusChange');
    component.statusChange.subscribe(spy);
    fixture.nativeElement.querySelector('[data-status="completed"]').click();
    expect(spy).toHaveBeenCalledWith('completed');
  });

  it('should mark the button matching currentStatus as active', () => {
    fixture.componentRef.setInput('currentStatus', 'active');
    fixture.detectChanges();
    const activeBtn = fixture.nativeElement.querySelector('[data-status="active"]');
    const allBtn = fixture.nativeElement.querySelector('[data-status="all"]');
    expect(activeBtn.classList.contains('active')).toBeTrue();
    expect(allBtn.classList.contains('active')).toBeFalse();
  });

  it('should render a search text input', () => {
    expect(fixture.nativeElement.querySelector('input[type="text"]')).toBeTruthy();
  });

  it('should emit searchChange with the typed value when input event fires', () => {
    const spy = jasmine.createSpy('searchChange');
    component.searchChange.subscribe(spy);
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="text"]');
    input.value = 'hello';
    input.dispatchEvent(new Event('input'));
    expect(spy).toHaveBeenCalledWith('hello');
  });

  it('should emit searchChange with empty string when input is cleared', () => {
    const spy = jasmine.createSpy('searchChange');
    component.searchChange.subscribe(spy);
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="text"]');
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(spy).toHaveBeenCalledWith('');
  });

  it('should reflect currentQ input in the search field value', () => {
    fixture.componentRef.setInput('currentQ', 'report');
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="text"]');
    expect(input.value).toBe('report');
  });

  it('should render a sort select element', () => {
    expect(fixture.nativeElement.querySelector('select[data-sort]')).toBeTruthy();
  });

  it('should emit sortChange with {sortBy:createdAt, sortDir:desc} when Newest selected', () => {
    const spy = jasmine.createSpy('sortChange');
    component.sortChange.subscribe(spy);
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[data-sort]');
    select.value = 'createdAt:desc';
    select.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith({ sortBy: 'createdAt', sortDir: 'desc' });
  });

  it('should emit sortChange with {sortBy:createdAt, sortDir:asc} when Oldest selected', () => {
    const spy = jasmine.createSpy('sortChange');
    component.sortChange.subscribe(spy);
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[data-sort]');
    select.value = 'createdAt:asc';
    select.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith({ sortBy: 'createdAt', sortDir: 'asc' });
  });

  it('should emit sortChange with {sortBy:title, sortDir:asc} when Title A-Z selected', () => {
    const spy = jasmine.createSpy('sortChange');
    component.sortChange.subscribe(spy);
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[data-sort]');
    select.value = 'title:asc';
    select.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith({ sortBy: 'title', sortDir: 'asc' });
  });

  it('should emit sortChange with {sortBy:title, sortDir:desc} when Title Z-A selected', () => {
    const spy = jasmine.createSpy('sortChange');
    component.sortChange.subscribe(spy);
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[data-sort]');
    select.value = 'title:desc';
    select.dispatchEvent(new Event('change'));
    expect(spy).toHaveBeenCalledWith({ sortBy: 'title', sortDir: 'desc' });
  });

  it('should reflect currentSortBy and currentSortDir inputs in the select value', () => {
    fixture.componentRef.setInput('currentSortBy', 'title');
    fixture.componentRef.setInput('currentSortDir', 'asc');
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[data-sort]');
    expect(select.value).toBe('title:asc');
  });
});
