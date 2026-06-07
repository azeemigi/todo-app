package com.example.todoapi.service;

import com.example.todoapi.model.Todo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TodoServiceTest {

    private TodoService todoService;

    @BeforeEach
    void setUp() {
        todoService = new TodoService();
    }

    @Test
    void findAll_returnsEmptyList_whenNoTodosExist() {
        List<Todo> result = todoService.findAll();
        assertThat(result).isEmpty();
    }

    @Test
    void findAll_returnsNewestFirst() {
        todoService.create("First", null);
        todoService.create("Second", null);

        List<Todo> result = todoService.findAll();
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getTitle()).isEqualTo("Second");
        assertThat(result.get(1).getTitle()).isEqualTo("First");
    }

    @Test
    void create_persistsTodo() {
        Todo created = todoService.create("Test title", "Test description");

        assertThat(created.getId()).isNotNull();
        assertThat(created.getTitle()).isEqualTo("Test title");
        assertThat(created.getDescription()).isEqualTo("Test description");
        assertThat(created.isCompleted()).isFalse();
        assertThat(created.getCreatedAt()).isNotNull();
        assertThat(created.getUpdatedAt()).isNotNull();
        assertThat(todoService.findAll()).hasSize(1);
    }
}
