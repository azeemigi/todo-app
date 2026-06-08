export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateTodoDto {
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string | null;
}

export interface ApiError {
  status: number;
  message: string;
  timestamp: string;
  fieldErrors?: Record<string, string>;
}

export interface TodoFilter {
  status?: string;
  q?: string;
  sortBy?: string;
  sortDir?: string;
  dueFilter?: string;
}
