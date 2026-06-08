import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TodoListComponent } from './features/todo/todo-list/todo-list.component';
import { TodoFormComponent } from './features/todo/todo-form/todo-form.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TodoFormComponent, TodoListComponent],
  template: `
    <main class="app-container">
      <header>
        <h1>TODO App</h1>
      </header>
      <app-todo-form (created)="todoList.reload()" />
      <app-todo-list #todoList />
    </main>
  `,
  styleUrl: './app.component.scss'
})
export class AppComponent {}
