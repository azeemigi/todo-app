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
    void findAll_returnsEmptyList_whenNoTodosExist() {
        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).isEmpty();
    }

    @Test
    void findAll_returnsNewestFirst() {
        todoService.create("First", null);
        todoService.create("Second", null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC);
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
        assertThat(todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC)).hasSize(1);
    }

    // T012: Status filtering
    @Test
    void findAll_withStatusActive_returnsOnlyIncompleteTodos() {
        todoService.create("Active 1", null);
        Todo completed = todoService.create("Completed 1", null);
        todoService.patch(completed.getId(), true);

        List<Todo> result = todoService.findAll(TodoStatus.ACTIVE, null, SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).isCompleted()).isFalse();
        assertThat(result.get(0).getTitle()).isEqualTo("Active 1");
    }

    @Test
    void findAll_withStatusCompleted_returnsOnlyCompletedTodos() {
        todoService.create("Active 1", null);
        Todo completed = todoService.create("Completed 1", null);
        todoService.patch(completed.getId(), true);

        List<Todo> result = todoService.findAll(TodoStatus.COMPLETED, null, SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).isCompleted()).isTrue();
        assertThat(result.get(0).getTitle()).isEqualTo("Completed 1");
    }

    @Test
    void findAll_withStatusAll_returnsAllTodos() {
        todoService.create("Active 1", null);
        Todo completed = todoService.create("Completed 1", null);
        todoService.patch(completed.getId(), true);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).hasSize(2);
    }

    // T020: Text search
    @Test
    void findAll_withQuery_matchesTitleCaseInsensitive() {
        todoService.create("Submit monthly report", "Finance team");
        todoService.create("Buy groceries", null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, "REPORT", SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Submit monthly report");
    }

    @Test
    void findAll_withQuery_matchesDescriptionCaseInsensitive() {
        todoService.create("Submit report", "Finance team deadline");
        todoService.create("Buy groceries", "Milk eggs");

        List<Todo> result = todoService.findAll(TodoStatus.ALL, "finance", SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Submit report");
    }

    @Test
    void findAll_withBlankQuery_returnsAll() {
        todoService.create("First", null);
        todoService.create("Second", null);

        assertThat(todoService.findAll(TodoStatus.ALL, "  ", SortBy.CREATED_AT, SortDir.DESC)).hasSize(2);
        assertThat(todoService.findAll(TodoStatus.ALL, "", SortBy.CREATED_AT, SortDir.DESC)).hasSize(2);
        assertThat(todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC)).hasSize(2);
    }

    @Test
    void findAll_withQuery_noMatch_returnsEmpty() {
        todoService.create("Buy groceries", null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, "xyzzy", SortBy.CREATED_AT, SortDir.DESC);
        assertThat(result).isEmpty();
    }

    // T025: Sort
    @Test
    void findAll_sortByCreatedAtAsc_returnsOldestFirst() throws InterruptedException {
        todoService.create("First", null);
        Thread.sleep(5);
        todoService.create("Second", null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.ASC);
        assertThat(result.get(0).getTitle()).isEqualTo("First");
        assertThat(result.get(1).getTitle()).isEqualTo("Second");
    }

    @Test
    void findAll_sortByTitleAsc_returnsAlphabeticallyAscending() {
        todoService.create("Zebra task", null);
        todoService.create("Alpha task", null);
        todoService.create("Mango task", null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.TITLE, SortDir.ASC);
        assertThat(result.get(0).getTitle()).isEqualTo("Alpha task");
        assertThat(result.get(1).getTitle()).isEqualTo("Mango task");
        assertThat(result.get(2).getTitle()).isEqualTo("Zebra task");
    }

    @Test
    void findAll_sortByTitleDesc_returnsAlphabeticallyDescending() {
        todoService.create("Alpha task", null);
        todoService.create("Zebra task", null);
        todoService.create("Mango task", null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.TITLE, SortDir.DESC);
        assertThat(result.get(0).getTitle()).isEqualTo("Zebra task");
        assertThat(result.get(1).getTitle()).isEqualTo("Mango task");
        assertThat(result.get(2).getTitle()).isEqualTo("Alpha task");
    }

    @Test
    void findAll_sortAppliesWithinFilteredSet() {
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
