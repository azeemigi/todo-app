import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { TodoEditComponent } from './todo-edit.component';
import { TodoService } from '../../../core/services/todo.service';
import { Todo } from '../../../core/models/todo.model';

const testTodo: Todo = {
  id: '42',
  title: 'Original title',
  description: 'Original desc',
  completed: false,
  createdAt: '2026-06-07T10:00:00Z',
  updatedAt: '2026-06-07T10:00:00Z'
};

describe('TodoEditComponent', () => {
  let fixture: ComponentFixture<TodoEditComponent>;
  let mockService: jasmine.SpyObj<TodoService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('TodoService', ['update']);
    mockService.update.and.returnValue(of({ ...testTodo, title: 'Updated' }));

    await TestBed.configureTestingModule({
      imports: [TodoEditComponent, ReactiveFormsModule],
      providers: [{ provide: TodoService, useValue: mockService }]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoEditComponent);
    fixture.componentInstance.todo = testTodo;
    fixture.detectChanges();
  });

  const titleInput = () => fixture.nativeElement.querySelector('input[formControlName="title"]') as HTMLInputElement;
  const saveBtn = () => fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
  const cancelBtn = () => fixture.nativeElement.querySelector('.cancel-edit-btn') as HTMLButtonElement;

  it('should pre-populate the form with the current todo title and description', () => {
    expect(titleInput().value).toBe('Original title');
  });

  it('should call service update and emit saved when form is valid', () => {
    let savedEmitted = false;
    fixture.componentInstance.saved.subscribe(() => { savedEmitted = true; });
    saveBtn().click();
    expect(mockService.update).toHaveBeenCalledWith('42', jasmine.objectContaining({ title: 'Original title' }));
    expect(savedEmitted).toBeTrue();
  });

  it('should show validation error and not call service when title is blank', () => {
    titleInput().value = '';
    titleInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    saveBtn().click();
    fixture.detectChanges();
    expect(mockService.update).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.field-error')).toBeTruthy();
  });

  it('should emit cancelled and not call service when cancel is clicked', () => {
    let cancelled = false;
    fixture.componentInstance.cancelled.subscribe(() => { cancelled = true; });
    cancelBtn().click();
    expect(cancelled).toBeTrue();
    expect(mockService.update).not.toHaveBeenCalled();
  });

  it('should show server error message when update fails', () => {
    mockService.update.and.returnValue(throwError(() => new Error('500')));
    saveBtn().click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.field-error')).toBeTruthy();
  });
});
