package com.example.todoapi.service;

import com.example.todoapi.model.SortBy;
import com.example.todoapi.model.SortDir;
import com.example.todoapi.model.Todo;
import com.example.todoapi.model.TodoStatus;
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
    void shouldReturnEmptyListWhenNoTodosExist() {
        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).isEmpty();
    }

    @Test
    void shouldReturnTodosNewestFirstByDefault() {
        todoService.create("First", null);
        todoService.create("Second", null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getTitle()).isEqualTo("Second");
        assertThat(result.get(1).getTitle()).isEqualTo("First");
    }

    @Test
    void shouldPersistCreatedTodo() {
        Todo created = todoService.create("Test title", "Test description");

        assertThat(created.getId()).isNotNull();
        assertThat(created.getTitle()).isEqualTo("Test title");
        assertThat(created.getDescription()).isEqualTo("Test description");
        assertThat(created.isCompleted()).isFalse();
        assertThat(created.getCreatedAt()).isNotNull();
        assertThat(created.getUpdatedAt()).isNotNull();
        assertThat(todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC)).hasSize(1);
    }

    @Test
    void shouldReturnOnlyActiveTodosWhenStatusIsActive() {
        todoService.create("Active 1", null);
        Todo completed = todoService.create("Completed 1", null);
        todoService.patch(completed.getId(), true);

        List<Todo> result = todoService.findAll(TodoStatus.ACTIVE, null, SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).isCompleted()).isFalse();
        assertThat(result.get(0).getTitle()).isEqualTo("Active 1");
    }

    @Test
    void shouldReturnOnlyCompletedTodosWhenStatusIsCompleted() {
        todoService.create("Active 1", null);
        Todo completed = todoService.create("Completed 1", null);
        todoService.patch(completed.getId(), true);

        List<Todo> result = todoService.findAll(TodoStatus.COMPLETED, null, SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).isCompleted()).isTrue();
        assertThat(result.get(0).getTitle()).isEqualTo("Completed 1");
    }

    @Test
    void shouldReturnAllTodosWhenStatusIsAll() {
        todoService.create("Active 1", null);
        Todo completed = todoService.create("Completed 1", null);
        todoService.patch(completed.getId(), true);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).hasSize(2);
    }

    @Test
    void shouldMatchTitleCaseInsensitivelyWhenQueryProvided() {
        todoService.create("Submit monthly report", "Finance team");
        todoService.create("Buy groceries", null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, "REPORT", SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Submit monthly report");
    }

    @Test
    void shouldMatchDescriptionCaseInsensitivelyWhenQueryProvided() {
        todoService.create("Submit report", "Finance team deadline");
        todoService.create("Buy groceries", "Milk eggs");

        List<Todo> result = todoService.findAll(TodoStatus.ALL, "finance", SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Submit report");
    }

    @Test
    void shouldReturnAllTodosWhenQueryIsBlankOrNull() {
        todoService.create("First", null);
        todoService.create("Second", null);

        assertThat(todoService.findAll(TodoStatus.ALL, "  ", SortBy.CREATED_AT, SortDir.DESC)).hasSize(2);
        assertThat(todoService.findAll(TodoStatus.ALL, "", SortBy.CREATED_AT, SortDir.DESC)).hasSize(2);
        assertThat(todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC)).hasSize(2);
    }

    @Test
    void shouldReturnEmptyListWhenQueryMatchesNoTodos() {
        todoService.create("Buy groceries", null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, "xyzzy", SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).isEmpty();
    }

    @Test
    void shouldReturnOldestFirstWhenSortByCreatedAtAscending() throws InterruptedException {
        todoService.create("First", null);
        Thread.sleep(5);
        todoService.create("Second", null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.ASC);
        assertThat(result.get(0).getTitle()).isEqualTo("First");
        assertThat(result.get(1).getTitle()).isEqualTo("Second");
    }

    @Test
    void shouldReturnAlphabeticallyAscendingWhenSortByTitleAscending() {
        todoService.create("Zebra task", null);
        todoService.create("Alpha task", null);
        todoService.create("Mango task", null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.TITLE, SortDir.ASC);
        assertThat(result.get(0).getTitle()).isEqualTo("Alpha task");
        assertThat(result.get(1).getTitle()).isEqualTo("Mango task");
        assertThat(result.get(2).getTitle()).isEqualTo("Zebra task");
    }

    @Test
    void shouldReturnAlphabeticallyDescendingWhenSortByTitleDescending() {
        todoService.create("Alpha task", null);
        todoService.create("Zebra task", null);
        todoService.create("Mango task", null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.TITLE, SortDir.DESC);
        assertThat(result.get(0).getTitle()).isEqualTo("Zebra task");
        assertThat(result.get(1).getTitle()).isEqualTo("Mango task");
        assertThat(result.get(2).getTitle()).isEqualTo("Alpha task");
    }

    @Test
    void shouldApplySortWithinFilteredSet() {
        todoService.create("Alpha active", null);
        Todo c = todoService.create("Mango completed", null);
        todoService.patch(c.getId(), true);
        todoService.create("Zebra active", null);

        List<Todo> result = todoService.findAll(TodoStatus.ACTIVE, null, SortBy.TITLE, SortDir.ASC);
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getTitle()).isEqualTo("Alpha active");
        assertThat(result.get(1).getTitle()).isEqualTo("Zebra active");
    }
}
