import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TodoFormComponent } from './todo-form.component';
import { TodoService } from '../../services/todo.service';

describe('TodoFormComponent', () => {
  let fixture: ComponentFixture<TodoFormComponent>;
  let mockService: jasmine.SpyObj<TodoService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('TodoService', ['createTodo'], {
      error: signal<string | null>(null)
    });

    await TestBed.configureTestingModule({
      imports: [TodoFormComponent, ReactiveFormsModule],
      providers: [{ provide: TodoService, useValue: mockService }]
    }).compileComponents();

    fixture = TestBed.createComponent(TodoFormComponent);
    fixture.detectChanges();
  });

  const titleInput = () => fixture.nativeElement.querySelector('input[formControlName="title"]') as HTMLInputElement;
  const descInput = () => fixture.nativeElement.querySelector('textarea[formControlName="description"]') as HTMLTextAreaElement;
  const submitBtn = () => fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;

  it('submit with valid title calls todoService.createTodo()', () => {
    titleInput().value = 'Buy groceries';
    titleInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    submitBtn().click();
    expect(mockService.createTodo).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Buy groceries' }));
  });

  it('empty title shows validation error without calling service', () => {
    titleInput().value = '';
    titleInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    submitBtn().click();
    fixture.detectChanges();
    expect(mockService.createTodo).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.field-error')).toBeTruthy();
  });

  it('title >200 chars shows validation error', () => {
    titleInput().value = 'x'.repeat(201);
    titleInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    submitBtn().click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.field-error')).toBeTruthy();
    expect(mockService.createTodo).not.toHaveBeenCalled();
  });

  it('description >1000 chars shows validation error', () => {
    titleInput().value = 'Valid title';
    descInput().value = 'y'.repeat(1001);
    titleInput().dispatchEvent(new Event('input'));
    descInput().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    submitBtn().click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.field-error')).toBeTruthy();
    expect(mockService.createTodo).not.toHaveBeenCalled();
  });
});
