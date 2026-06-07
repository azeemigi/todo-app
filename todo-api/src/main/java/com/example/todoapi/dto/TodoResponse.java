package com.example.todoapi.dto;

import com.example.todoapi.model.Todo;

public record TodoResponse(
        String id,
        String title,
        String description,
        boolean completed,
        String createdAt,
        String updatedAt
) {
    public static TodoResponse from(Todo todo) {
        return new TodoResponse(
                todo.getId().toString(),
                todo.getTitle(),
                todo.getDescription(),
                todo.isCompleted(),
                todo.getCreatedAt().toString(),
                todo.getUpdatedAt().toString()
        );
    }
}
