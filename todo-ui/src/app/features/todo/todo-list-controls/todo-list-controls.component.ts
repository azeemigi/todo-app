import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-todo-list-controls',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="list-controls">
      <div class="status-filter">
        <button
          data-status="all"
          [class.active]="currentStatus === 'all'"
          (click)="statusChange.emit('all')">
          All
        </button>
        <button
          data-status="active"
          [class.active]="currentStatus === 'active'"
          (click)="statusChange.emit('active')">
          Active
        </button>
        <button
          data-status="completed"
          [class.active]="currentStatus === 'completed'"
          (click)="statusChange.emit('completed')">
          Completed
        </button>
      </div>

      <div class="due-filter">
        <button
          data-due-filter="overdue"
          [class.active]="currentDueFilter === 'overdue'"
          (click)="dueFilterChange.emit(currentDueFilter === 'overdue' ? '' : 'overdue')">
          Overdue
        </button>
        <button
          data-due-filter="due-this-week"
          [class.active]="currentDueFilter === 'due-this-week'"
          (click)="dueFilterChange.emit(currentDueFilter === 'due-this-week' ? '' : 'due-this-week')">
          Due this week
        </button>
      </div>

      <input
        type="text"
        placeholder="Search todos..."
        [value]="currentQ"
        (input)="searchChange.emit($any($event.target).value)"
      />

      <select
        data-sort
        [value]="currentSortBy + ':' + currentSortDir"
        (change)="onSortChange($any($event.target).value)">
        <option value="createdAt:desc">Newest</option>
        <option value="createdAt:asc">Oldest</option>
        <option value="title:asc">Title A-Z</option>
        <option value="title:desc">Title Z-A</option>
        <option value="dueDate:asc">Due date (soonest first)</option>
        <option value="dueDate:desc">Due date (latest first)</option>
      </select>
    </div>
  `,
  styleUrl: './todo-list-controls.component.scss'
})
export class TodoListControlsComponent {
  @Input() currentStatus = 'all';
  @Input() currentQ = '';
  @Input() currentSortBy = 'createdAt';
  @Input() currentSortDir = 'desc';
  @Input() currentDueFilter = '';

  @Output() statusChange = new EventEmitter<string>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<{ sortBy: string; sortDir: string }>();
  @Output() dueFilterChange = new EventEmitter<string>();

  onSortChange(value: string): void {
    const [sortBy, sortDir] = value.split(':');
    this.sortChange.emit({ sortBy, sortDir });
  }
}
