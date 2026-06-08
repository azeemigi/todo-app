package com.example.todoapi.dto;

import com.example.todoapi.model.Todo;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class TodoResponseTest {

    private Todo buildTodo(LocalDate dueDate) {
        Todo todo = new Todo();
        todo.setId(UUID.randomUUID());
        todo.setTitle("Test");
        todo.setDescription(null);
        todo.setCompleted(false);
        Instant now = Instant.parse("2026-06-08T10:00:00Z");
        todo.setCreatedAt(now);
        todo.setUpdatedAt(now);
        todo.setDueDate(dueDate);
        return todo;
    }

    @Test
    void shouldMapDueDateToIsoStringWhenDueDateIsSet() {
        // Given
        Todo todo = buildTodo(LocalDate.of(2026, 6, 15));

        // When
        TodoResponse response = TodoResponse.from(todo);

        // Then
        assertThat(response.dueDate()).isEqualTo("2026-06-15");
    }

    @Test
    void shouldReturnNullDueDateWhenDueDateIsNotSet() {
        // Given
        Todo todo = buildTodo(null);

        // When
        TodoResponse response = TodoResponse.from(todo);

        // Then
        assertThat(response.dueDate()).isNull();
    }
}
