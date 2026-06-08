import { Component, ChangeDetectionStrategy, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { finalize } from 'rxjs';
import { Todo, TodoFilter } from '../../../core/models/todo.model';
import { TodoService } from '../../../core/services/todo.service';
import { TodoItemComponent } from '../todo-item/todo-item.component';
import { TodoListControlsComponent } from '../todo-list-controls/todo-list-controls.component';

const VALID_STATUSES = ['all', 'active', 'completed'];
const VALID_SORT_BY = ['createdAt', 'title', 'dueDate'];
const VALID_SORT_DIR = ['asc', 'desc'];
const VALID_DUE_FILTERS = ['overdue', 'due-this-week'];

@Component({
  selector: 'app-todo-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TodoItemComponent, TodoListControlsComponent],
  template: `
    <app-todo-list-controls
      [currentStatus]="status()"
      [currentQ]="q()"
      [currentSortBy]="sortBy()"
      [currentSortDir]="sortDir()"
      [currentDueFilter]="dueFilter()"
      (statusChange)="updateFilter({status: $event})"
      (searchChange)="updateFilter({q: $event})"
      (sortChange)="updateFilter($event)"
      (dueFilterChange)="updateFilter({dueFilter: $event})"
    />
    @if (loading()) {
      <div class="loading-spinner">
        <p>Loading TODOs...</p>
      </div>
    } @else if (error()) {
      <div class="error-message">
        <p>{{ error() }}</p>
        <button (click)="retry()">Retry</button>
      </div>
    } @else if (todos().length === 0) {
      <div class="empty-state">
        @if (hasActiveFilter()) {
          <p class="no-results">No TODOs match your current filter. Try adjusting your search.</p>
        } @else {
          <p>No TODOs yet. Create one above!</p>
        }
      </div>
    } @else {
      <div class="todo-list">
        @for (todo of todos(); track todo.id) {
          <app-todo-item [todo]="todo" (reloaded)="reload()" />
        }
      </div>
    }
  `,
  styleUrl: './todo-list.component.scss'
})
export class TodoListComponent {
  private readonly svc = inject(TodoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: convertToParamMap({})
  });

  private _requestGen = 0;

  readonly todos = signal<Todo[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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

  readonly dueFilter = computed(() => {
    const v = this.queryParams().get('dueFilter') ?? '';
    return VALID_DUE_FILTERS.includes(v) ? v : '';
  });

  readonly hasActiveFilter = computed(() =>
    this.status() !== 'all' || !!this.q() || this.sortBy() !== 'createdAt' || this.sortDir() !== 'desc' || !!this.dueFilter()
  );

  constructor() {
    effect(() => {
      this.loadTodos({
        status: this.status(),
        q: this.q(),
        sortBy: this.sortBy(),
        sortDir: this.sortDir(),
        dueFilter: this.dueFilter() || undefined
      });
    });
  }

  reload(): void {
    this.loadTodos({
      status: this.status(),
      q: this.q(),
      sortBy: this.sortBy(),
      sortDir: this.sortDir(),
      dueFilter: this.dueFilter() || undefined
    });
  }

  retry(): void {
    this.reload();
  }

  updateFilter(changes: Partial<TodoFilter>): void {
    this.router.navigate([], {
      queryParams: changes,
      queryParamsHandling: 'merge'
    });
  }

  private loadTodos(filter: TodoFilter): void {
    const gen = ++this._requestGen;
    this.loading.set(true);
    this.error.set(null);
    this.svc.findAll(filter).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: todos => {
        if (gen === this._requestGen) {
          this.todos.set(todos);
        }
      },
      error: () => {
        if (gen === this._requestGen) {
          this.error.set('Failed to load TODOs');
        }
      }
    });
  }
}
