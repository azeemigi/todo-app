import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Todo, CreateTodoDto, UpdateTodoDto, TodoFilter } from '../models/todo.model';

@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly http = inject(HttpClient);
  private readonly API = '/api/todos';

  findAll(filter?: TodoFilter): Observable<Todo[]> {
    let params = new HttpParams();
    if (filter?.status) params = params.set('status', filter.status);
    if (filter?.q?.trim()) params = params.set('q', filter.q);
    if (filter?.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter?.sortDir) params = params.set('sortDir', filter.sortDir);
    return this.http.get<Todo[]>(this.API, { params });
  }

  create(dto: CreateTodoDto): Observable<Todo> {
    return this.http.post<Todo>(this.API, dto);
  }

  update(id: string, dto: UpdateTodoDto): Observable<Todo> {
    return this.http.put<Todo>(`${this.API}/${id}`, dto);
  }

  patch(id: string, completed: boolean): Observable<Todo> {
    return this.http.patch<Todo>(`${this.API}/${id}`, { completed });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
