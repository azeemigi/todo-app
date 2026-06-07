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

export interface PatchTodoDto {
  completed: boolean;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ApiError {
  errors: FieldError[];
}
