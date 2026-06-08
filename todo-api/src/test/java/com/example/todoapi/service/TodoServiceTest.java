package com.example.todoapi.service;

import com.example.todoapi.model.DueFilter;
import com.example.todoapi.model.SortBy;
import com.example.todoapi.model.SortDir;
import com.example.todoapi.model.Todo;
import com.example.todoapi.model.TodoStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
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
        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC, null);
        assertThat(result).isEmpty();
    }

    @Test
    void shouldReturnTodosNewestFirstByDefault() {
        todoService.create("First", null, null);
        todoService.create("Second", null, null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC, null);
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getTitle()).isEqualTo("Second");
        assertThat(result.get(1).getTitle()).isEqualTo("First");
    }

    @Test
    void shouldPersistCreatedTodo() {
        Todo created = todoService.create("Test title", "Test description", null);

        assertThat(created.getId()).isNotNull();
        assertThat(created.getTitle()).isEqualTo("Test title");
        assertThat(created.getDescription()).isEqualTo("Test description");
        assertThat(created.isCompleted()).isFalse();
        assertThat(created.getCreatedAt()).isNotNull();
        assertThat(created.getUpdatedAt()).isNotNull();
        assertThat(todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC, null)).hasSize(1);
    }

    @Test
    void shouldReturnOnlyActiveTodosWhenStatusIsActive() {
        todoService.create("Active 1", null, null);
        Todo completed = todoService.create("Completed 1", null, null);
        todoService.patch(completed.getId(), true);

        List<Todo> result = todoService.findAll(TodoStatus.ACTIVE, null, SortBy.CREATED_AT, SortDir.DESC, null);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).isCompleted()).isFalse();
        assertThat(result.get(0).getTitle()).isEqualTo("Active 1");
    }

    @Test
    void shouldReturnOnlyCompletedTodosWhenStatusIsCompleted() {
        todoService.create("Active 1", null, null);
        Todo completed = todoService.create("Completed 1", null, null);
        todoService.patch(completed.getId(), true);

        List<Todo> result = todoService.findAll(TodoStatus.COMPLETED, null, SortBy.CREATED_AT, SortDir.DESC, null);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).isCompleted()).isTrue();
        assertThat(result.get(0).getTitle()).isEqualTo("Completed 1");
    }

    @Test
    void shouldReturnAllTodosWhenStatusIsAll() {
        todoService.create("Active 1", null, null);
        Todo completed = todoService.create("Completed 1", null, null);
        todoService.patch(completed.getId(), true);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC, null);
        assertThat(result).hasSize(2);
    }

    @Test
    void shouldMatchTitleCaseInsensitivelyWhenQueryProvided() {
        todoService.create("Submit monthly report", "Finance team", null);
        todoService.create("Buy groceries", null, null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, "REPORT", SortBy.CREATED_AT, SortDir.DESC, null);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Submit monthly report");
    }

    @Test
    void shouldMatchDescriptionCaseInsensitivelyWhenQueryProvided() {
        todoService.create("Submit report", "Finance team deadline", null);
        todoService.create("Buy groceries", "Milk eggs", null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, "finance", SortBy.CREATED_AT, SortDir.DESC, null);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Submit report");
    }

    @Test
    void shouldReturnAllTodosWhenQueryIsBlankOrNull() {
        todoService.create("First", null, null);
        todoService.create("Second", null, null);

        assertThat(todoService.findAll(TodoStatus.ALL, "  ", SortBy.CREATED_AT, SortDir.DESC, null)).hasSize(2);
        assertThat(todoService.findAll(TodoStatus.ALL, "", SortBy.CREATED_AT, SortDir.DESC, null)).hasSize(2);
        assertThat(todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC, null)).hasSize(2);
    }

    @Test
    void shouldReturnEmptyListWhenQueryMatchesNoTodos() {
        todoService.create("Buy groceries", null, null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, "xyzzy", SortBy.CREATED_AT, SortDir.DESC, null);
        assertThat(result).isEmpty();
    }

    @Test
    void shouldReturnOldestFirstWhenSortByCreatedAtAscending() throws InterruptedException {
        todoService.create("First", null, null);
        Thread.sleep(5);
        todoService.create("Second", null, null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.ASC, null);
        assertThat(result.get(0).getTitle()).isEqualTo("First");
        assertThat(result.get(1).getTitle()).isEqualTo("Second");
    }

    @Test
    void shouldReturnAlphabeticallyAscendingWhenSortByTitleAscending() {
        todoService.create("Zebra task", null, null);
        todoService.create("Alpha task", null, null);
        todoService.create("Mango task", null, null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.TITLE, SortDir.ASC, null);
        assertThat(result.get(0).getTitle()).isEqualTo("Alpha task");
        assertThat(result.get(1).getTitle()).isEqualTo("Mango task");
        assertThat(result.get(2).getTitle()).isEqualTo("Zebra task");
    }

    @Test
    void shouldReturnAlphabeticallyDescendingWhenSortByTitleDescending() {
        todoService.create("Alpha task", null, null);
        todoService.create("Zebra task", null, null);
        todoService.create("Mango task", null, null);

        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.TITLE, SortDir.DESC, null);
        assertThat(result.get(0).getTitle()).isEqualTo("Zebra task");
        assertThat(result.get(1).getTitle()).isEqualTo("Mango task");
        assertThat(result.get(2).getTitle()).isEqualTo("Alpha task");
    }

    @Test
    void shouldApplySortWithinFilteredSet() {
        todoService.create("Alpha active", null, null);
        Todo c = todoService.create("Mango completed", null, null);
        todoService.patch(c.getId(), true);
        todoService.create("Zebra active", null, null);

        List<Todo> result = todoService.findAll(TodoStatus.ACTIVE, null, SortBy.TITLE, SortDir.ASC, null);
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getTitle()).isEqualTo("Alpha active");
        assertThat(result.get(1).getTitle()).isEqualTo("Zebra active");
    }

    // T007 — US1: due date on create

    @Test
    void shouldCreateTodoWithDueDateWhenProvided() {
        // Given
        LocalDate dueDate = LocalDate.of(2026, 6, 15);

        // When
        Todo created = todoService.create("Pay bill", null, dueDate);

        // Then
        assertThat(created.getDueDate()).isEqualTo(dueDate);
    }

    @Test
    void shouldCreateTodoWithNullDueDateWhenNotProvided() {
        // When
        Todo created = todoService.create("Pay bill", null, null);

        // Then
        assertThat(created.getDueDate()).isNull();
    }

    // T027 — US3: dueFilter and DUE_DATE sort

    @Test
    void shouldReturnOnlyOverdueIncompleteTodosWhenDueFilterIsOverdue() {
        // Given
        LocalDate yesterday = LocalDate.now().minusDays(1);
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        todoService.create("Overdue task", null, yesterday);
        todoService.create("Future task", null, tomorrow);
        Todo completedOverdue = todoService.create("Done overdue", null, yesterday);
        todoService.patch(completedOverdue.getId(), true);

        // When
        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC, DueFilter.OVERDUE);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Overdue task");
    }

    @Test
    void shouldReturnTodosWithDueDateWithinSevenDaysWhenDueFilterIsDueThisWeek() {
        // Given
        LocalDate today = LocalDate.now();
        LocalDate inThreeDays = today.plusDays(3);
        LocalDate inTenDays = today.plusDays(10);
        todoService.create("Due in 3 days", null, inThreeDays);
        todoService.create("Due in 10 days", null, inTenDays);
        todoService.create("No due date", null, null);

        // When
        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.CREATED_AT, SortDir.DESC, DueFilter.DUE_THIS_WEEK);

        // Then
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Due in 3 days");
    }

    @Test
    void shouldSortByDueDateAscendingWithNullsLastWhenSortByDueDate() {
        // Given
        todoService.create("No date", null, null);
        todoService.create("Far future", null, LocalDate.of(2099, 12, 31));
        todoService.create("Near future", null, LocalDate.of(2026, 7, 1));

        // When
        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.DUE_DATE, SortDir.ASC, null);

        // Then
        assertThat(result.get(0).getTitle()).isEqualTo("Near future");
        assertThat(result.get(1).getTitle()).isEqualTo("Far future");
        assertThat(result.get(2).getTitle()).isEqualTo("No date");
    }

    @Test
    void shouldSortByDueDateDescendingWithNullsLastWhenSortDirIsDesc() {
        // Given
        todoService.create("No date", null, null);
        todoService.create("Far future", null, LocalDate.of(2099, 12, 31));
        todoService.create("Near future", null, LocalDate.of(2026, 7, 1));

        // When
        List<Todo> result = todoService.findAll(TodoStatus.ALL, null, SortBy.DUE_DATE, SortDir.DESC, null);

        // Then
        assertThat(result.get(0).getTitle()).isEqualTo("Far future");
        assertThat(result.get(1).getTitle()).isEqualTo("Near future");
        assertThat(result.get(2).getTitle()).isEqualTo("No date");
    }
}
