import { Component, effect, inject } from '@angular/core';
import { TodoListComponent } from './components/todo-list/todo-list.component';
import { TodoFormComponent } from './components/todo-form/todo-form.component';
import { TodoService } from './services/todo.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TodoFormComponent, TodoListComponent],
  template: `
    <main class="app-container">
      <header>
        <h1>TODO App</h1>
      </header>
      <app-todo-form />
      <app-todo-list />
    </main>
  `,
  styles: [`
    .app-container { max-width: 800px; margin: 0 auto; padding: 1rem; }
    header { margin-bottom: 1.5rem; }
    h1 { margin: 0; font-size: 1.75rem; }
  `]
})
export class AppComponent {
  constructor() {
    const todoService = inject(TodoService);
    effect(() => todoService.loadTodos());
  }
}
