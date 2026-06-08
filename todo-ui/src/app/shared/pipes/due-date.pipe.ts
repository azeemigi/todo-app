import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dueDate', standalone: true, pure: true })
export class DueDatePipe implements PipeTransform {
  transform(value: string | null): string {
    if (!value) return '';
    const date = new Date(value + 'T00:00:00');
    const currentYear = new Date().getFullYear();
    const options: Intl.DateTimeFormatOptions = date.getFullYear() === currentYear
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }
}
