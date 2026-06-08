export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
}

export interface UpdateTodoDto {
  title: string;
  description?: string;
  completed: boolean;
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
}
