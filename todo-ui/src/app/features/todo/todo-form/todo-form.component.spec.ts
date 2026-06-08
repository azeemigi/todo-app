import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { TodoFormComponent } from './todo-form.component';
import { TodoService } from '../../../core/services/todo.service';
import { Todo } from '../../../core/models/todo.model';

const mockTodo: Todo = {
  id: '1',
  title: 'Buy groceries',
  description: null,
  completed: false,
  createdAt: '2026-06-07T10:00:00Z',
  updatedAt: '2026-06-07T10:00:00Z',
  dueDate: null
};

describe('TodoFormComponent', () => {
  let fixture: ComponentFixture<TodoFormComponent>;
  let mockService: jasmine.SpyObj<TodoService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('TodoService', ['create']);
    mockService.create.and.returnValue(of(mockTodo));

    await TestBed.configureTestingModule({
      imports: [TodoFormComponent, ReactiveFormsModule],
      providers: [{ provide: TodoService, useValue: mockService }]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoFormComponent);
    fixture.detectChanges();
  });

  const titleInput = () => fixture.nativeElement.querySelector('input[formControlName="title"]') as HTMLInputElement;
  const descInput = () => fixture.nativeElement.querySelector('textarea[formControlName="description"]') as HTMLTextAreaElement;
  const dueDateInput = () => fixture.nativeElement.querySelector('input[formControlName="dueDate"]') as HTMLInputElement;
  const submitBtn = () => fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

  it('should call service create with correct dto when title is valid', () => {
    titleInput().value = 'Buy groceries';
    titleInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    submitBtn().click();
    expect(mockService.create).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Buy groceries' }));
  });

  it('should emit created event after successful submission', () => {
    let createdEmitted = false;
    fixture.componentInstance.created.subscribe(() => { createdEmitted = true; });
    titleInput().value = 'Buy groceries';
    titleInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    submitBtn().click();
    expect(createdEmitted).toBeTrue();
  });

  it('should show validation error and not call service when title is empty', () => {
    submitBtn().click();
    fixture.detectChanges();
    expect(mockService.create).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.field-error')).toBeTruthy();
  });

  it('should show validation error and not call service when title exceeds 200 chars', () => {
    titleInput().value = 'x'.repeat(201);
    titleInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    submitBtn().click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.field-error')).toBeTruthy();
    expect(mockService.create).not.toHaveBeenCalled();
  });

  it('should show validation error and not call service when description exceeds 1000 chars', () => {
    titleInput().value = 'Valid title';
    descInput().value = 'y'.repeat(1001);
    titleInput().dispatchEvent(new Event('input'));
    descInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    submitBtn().click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.field-error')).toBeTruthy();
    expect(mockService.create).not.toHaveBeenCalled();
  });

  it('should show server error message when create fails', () => {
    mockService.create.and.returnValue(throwError(() => new Error('500')));
    titleInput().value = 'Buy groceries';
    titleInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    submitBtn().click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.server-error')).toBeTruthy();
  });

  // T009 — US1: due date in create form

  it('should submit with dueDate when date is entered', () => {
    titleInput().value = 'Pay bill';
    titleInput().dispatchEvent(new Event('input'));
    dueDateInput().value = '2026-06-15';
    dueDateInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    submitBtn().click();
    expect(mockService.create).toHaveBeenCalledWith(jasmine.objectContaining({ dueDate: '2026-06-15' }));
  });

  it('should submit without dueDate when date field is empty', () => {
    titleInput().value = 'Pay bill';
    titleInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    submitBtn().click();
    const callArg = mockService.create.calls.mostRecent().args[0];
    expect(callArg['dueDate']).toBeUndefined();
  });
});
