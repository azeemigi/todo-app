import { Component, inject, computed, effect } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TodoService } from '../../services/todo.service';
import { TodoFilter } from '../../models/todo.model';
import { TodoItemComponent } from '../todo-item/todo-item.component';
import { TodoListControlsComponent } from '../todo-list-controls/todo-list-controls.component';

const VALID_STATUSES = ['all', 'active', 'completed'];
const VALID_SORT_BY = ['createdAt', 'title'];
const VALID_SORT_DIR = ['asc', 'desc'];

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [TodoItemComponent, TodoListControlsComponent],
  template: `
    <app-todo-list-controls
      [currentStatus]="status()"
      [currentQ]="q()"
      [currentSortBy]="sortBy()"
      [currentSortDir]="sortDir()"
      (statusChange)="updateFilter({status: $event})"
      (searchChange)="updateFilter({q: $event})"
      (sortChange)="updateFilter($event)"
    />
    @if (svc.loading()) {
      <div class="loading-spinner">
        <p>Loading TODOs...</p>
      </div>
    } @else if (svc.error()) {
      <div class="error-message">
        <p>{{ svc.error() }}</p>
        <button (click)="retry()">Retry</button>
      </div>
    } @else if (svc.todos().length === 0) {
      <div class="empty-state">
        @if (hasActiveFilter()) {
          <p class="no-results">No TODOs match your current filter. Try adjusting your search.</p>
        } @else {
          <p>No TODOs yet. Create one above!</p>
        }
      </div>
    } @else {
      <div class="todo-list">
        @for (todo of svc.todos(); track todo.id) {
          <app-todo-item [todo]="todo" />
        }
      </div>
    }
  `,
  styles: [`
    .loading-spinner { text-align: center; padding: 2rem; color: #666; }
    .error-message { padding: 1rem; background: #fee; border: 1px solid #fcc; border-radius: 4px; }
    .error-message button { margin-top: 0.5rem; }
    .empty-state { text-align: center; padding: 3rem; color: #888; }
  `]
})
export class TodoListComponent {
  protected svc = inject(TodoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private queryParams = toSignal(this.route.queryParamMap, {
    initialValue: convertToParamMap({})
  });

  readonly status = computed(() => {
    const v = this.queryParams().get('status') ?? '';
    return VALID_STATUSES.includes(v) ? v : 'all';
  });

  readonly q = computed(() => this.queryParams().get('q') ?? '');

  readonly sortBy = computed(() => {
    const v = this.queryParams().get('sortBy') ?? '';
    return VALID_SORT_BY.includes(v) ? v : 'createdAt';
  });

  readonly sortDir = computed(() => {
    const v = this.queryParams().get('sortDir') ?? '';
    return VALID_SORT_DIR.includes(v) ? v : 'desc';
  });

  readonly hasActiveFilter = computed(() =>
    this.status() !== 'all' || !!this.q() || this.sortBy() !== 'createdAt' || this.sortDir() !== 'desc'
  );

  constructor() {
    effect(() => {
      this.svc.loadTodos({
        status: this.status(),
        q: this.q(),
        sortBy: this.sortBy(),
        sortDir: this.sortDir()
      });
    });
  }

  updateFilter(changes: Partial<TodoFilter>): void {
    this.router.navigate([], {
      queryParams: changes,
      queryParamsHandling: 'merge'
    });
  }

  retry(): void {
    this.svc.loadTodos({
      status: this.status(),
      q: this.q(),
      sortBy: this.sortBy(),
      sortDir: this.sortDir()
    });
  }
}
