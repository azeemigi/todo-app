package com.example.todoapi.controller;

import com.example.todoapi.model.SortBy;
import com.example.todoapi.model.SortDir;
import com.example.todoapi.model.Todo;
import com.example.todoapi.model.TodoStatus;
import com.example.todoapi.service.TodoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.todoapi.dto.CreateTodoRequest;
import com.example.todoapi.dto.PatchTodoRequest;
import com.example.todoapi.dto.UpdateTodoRequest;
import org.springframework.http.MediaType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TodoController.class)
class TodoControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    TodoService todoService;

    @Autowired
    ObjectMapper objectMapper;

    private Todo buildTodo(String title, Instant createdAt) {
        Todo todo = new Todo();
        todo.setId(UUID.randomUUID());
        todo.setTitle(title);
        todo.setDescription(null);
        todo.setCompleted(false);
        todo.setCreatedAt(createdAt);
        todo.setUpdatedAt(createdAt);
        return todo;
    }

    private Todo buildTodo(String title, boolean completed, Instant createdAt) {
        Todo todo = buildTodo(title, createdAt);
        todo.setCompleted(completed);
        return todo;
    }

    private Todo buildTodoWithDueDate(String title, Instant createdAt, LocalDate dueDate) {
        Todo todo = buildTodo(title, createdAt);
        todo.setDueDate(dueDate);
        return todo;
    }

    @Test
    void shouldReturnEmptyListWhenNoTodosExist() throws Exception {
        when(todoService.findAll(any(), any(), any(), any(), any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/todos"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void shouldReturnTodosNewestFirstByDefault() throws Exception {
        Todo older = buildTodo("Older", Instant.parse("2026-06-07T09:00:00Z"));
        Todo newer = buildTodo("Newer", Instant.parse("2026-06-07T10:00:00Z"));
        when(todoService.findAll(any(), any(), any(), any(), any())).thenReturn(List.of(newer, older));

        mockMvc.perform(get("/api/todos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Newer"))
                .andExpect(jsonPath("$[1].title").value("Older"));
    }

    @Test
    void shouldReturnOnlyActiveTodosWhenStatusParamIsActive() throws Exception {
        Todo active = buildTodo("Active", false, Instant.parse("2026-06-07T10:00:00Z"));
        when(todoService.findAll(eq(TodoStatus.ACTIVE), any(), any(), any(), any())).thenReturn(List.of(active));

        mockMvc.perform(get("/api/todos?status=active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].completed").value(false));
    }

    @Test
    void shouldReturnOnlyCompletedTodosWhenStatusParamIsCompleted() throws Exception {
        Todo completed = buildTodo("Completed", true, Instant.parse("2026-06-07T10:00:00Z"));
        when(todoService.findAll(eq(TodoStatus.COMPLETED), any(), any(), any(), any())).thenReturn(List.of(completed));

        mockMvc.perform(get("/api/todos?status=completed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].completed").value(true));
    }

    @Test
    void shouldReturnAllTodosWhenStatusParamIsAll() throws Exception {
        when(todoService.findAll(eq(TodoStatus.ALL), any(), any(), any(), any())).thenReturn(List.of(
                buildTodo("A", false, Instant.parse("2026-06-07T09:00:00Z")),
                buildTodo("B", true, Instant.parse("2026-06-07T10:00:00Z"))
        ));

        mockMvc.perform(get("/api/todos?status=all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void shouldReturn400WithFieldErrorWhenStatusParamIsInvalid() throws Exception {
        mockMvc.perform(get("/api/todos?status=banana"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.status").value(org.hamcrest.Matchers.containsString("banana")));
    }

    @Test
    void shouldReturn200WithDefaultsWhenNoParamsProvided() throws Exception {
        when(todoService.findAll(eq(TodoStatus.ALL), any(), eq(SortBy.CREATED_AT), eq(SortDir.DESC), any()))
                .thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/todos"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturn200AndSortByTitleAscendingWhenSortParams() throws Exception {
        when(todoService.findAll(any(), any(), eq(SortBy.TITLE), eq(SortDir.ASC), any())).thenReturn(List.of(
                buildTodo("Alpha", Instant.parse("2026-06-07T10:00:00Z")),
                buildTodo("Zebra", Instant.parse("2026-06-07T09:00:00Z"))
        ));

        mockMvc.perform(get("/api/todos?sortBy=title&sortDir=asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Alpha"))
                .andExpect(jsonPath("$[1].title").value("Zebra"));
    }

    @Test
    void shouldReturn200AndSortByCreatedAtAscWhenSortParams() throws Exception {
        when(todoService.findAll(any(), any(), eq(SortBy.CREATED_AT), eq(SortDir.ASC), any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/todos?sortBy=createdAt&sortDir=asc"))
                .andExpect(status().isOk());
    }

    @Test
    void shouldReturn400WithFieldErrorWhenSortDirIsInvalid() throws Exception {
        mockMvc.perform(get("/api/todos?sortDir=sideways"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.sortDir").exists());
    }

    @Test
    void shouldReturn400WithFieldErrorWhenSortByIsInvalid() throws Exception {
        mockMvc.perform(get("/api/todos?sortBy=priority"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.sortBy").exists());
    }

    @Test
    void shouldReturn400WithMultipleFieldErrorsWhenMultipleParamsInvalid() throws Exception {
        mockMvc.perform(get("/api/todos?sortBy=priority&sortDir=sideways"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.sortBy").exists())
                .andExpect(jsonPath("$.fieldErrors.sortDir").exists());
    }

    @Test
    void shouldCreateTodoAndReturn201() throws Exception {
        Todo created = buildTodo("Buy milk", Instant.parse("2026-06-07T12:00:00Z"));
        when(todoService.create(anyString(), any(), any())).thenReturn(created);

        mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Buy milk\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Buy milk"));
    }

    @Test
    void shouldReturn400WhenTitleIsBlank() throws Exception {
        mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").exists());
    }

    @Test
    void shouldReturn400WhenTitleTooLong() throws Exception {
        String longTitle = "x".repeat(201);
        mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + longTitle + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn400WhenDescriptionTooLong() throws Exception {
        String longDesc = "y".repeat(1001);
        mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Valid\",\"description\":\"" + longDesc + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldMarkTodoCompleteWhenPatchedWithTrue() throws Exception {
        Todo completed = buildTodo("Task", Instant.parse("2026-06-07T12:00:00Z"));
        completed.setCompleted(true);
        UUID id = completed.getId();
        when(todoService.patch(eq(id), eq(true))).thenReturn(completed);

        mockMvc.perform(patch("/api/todos/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true));
    }

    @Test
    void shouldMarkTodoIncompleteWhenPatchedWithFalse() throws Exception {
        Todo incomplete = buildTodo("Task", Instant.parse("2026-06-07T12:00:00Z"));
        incomplete.setCompleted(false);
        UUID id = incomplete.getId();
        when(todoService.patch(eq(id), eq(false))).thenReturn(incomplete);

        mockMvc.perform(patch("/api/todos/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(false));
    }

    @Test
    void shouldReturn404WhenPatchingNonExistentTodo() throws Exception {
        UUID id = UUID.randomUUID();
        when(todoService.patch(eq(id), anyBoolean()))
                .thenThrow(new java.util.NoSuchElementException());

        mockMvc.perform(patch("/api/todos/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturn400WhenPatchBodyMissingCompleted() throws Exception {
        mockMvc.perform(patch("/api/todos/" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnUpdatedTodoWhenUpdateSucceeds() throws Exception {
        Todo updated = buildTodo("Updated title", Instant.parse("2026-06-07T12:00:00Z"));
        UUID id = updated.getId();
        when(todoService.update(eq(id), anyString(), any(), anyBoolean(), any())).thenReturn(updated);

        mockMvc.perform(put("/api/todos/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Updated title\",\"completed\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated title"));
    }

    @Test
    void shouldReturn404WhenUpdatingNonExistentTodo() throws Exception {
        UUID id = UUID.randomUUID();
        when(todoService.update(eq(id), anyString(), any(), anyBoolean(), any()))
                .thenThrow(new java.util.NoSuchElementException());

        mockMvc.perform(put("/api/todos/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"X\",\"completed\":false}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturn400WhenUpdateTitleIsBlank() throws Exception {
        mockMvc.perform(put("/api/todos/" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"\",\"completed\":false}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn400WhenUpdateMissingCompleted() throws Exception {
        mockMvc.perform(put("/api/todos/" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Valid\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturn204WhenDeleteSucceeds() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/todos/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    void shouldReturn404WhenDeletingNonExistentTodo() throws Exception {
        UUID id = UUID.randomUUID();
        org.mockito.Mockito.doThrow(new java.util.NoSuchElementException())
                .when(todoService).delete(eq(id));

        mockMvc.perform(delete("/api/todos/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    void shouldReturnTodoByIdWhenExists() throws Exception {
        Todo todo = buildTodo("Single", Instant.parse("2026-06-07T12:00:00Z"));
        UUID id = todo.getId();
        when(todoService.findById(id)).thenReturn(java.util.Optional.of(todo));

        mockMvc.perform(get("/api/todos/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Single"));
    }

    @Test
    void shouldReturn404WhenTodoByIdNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(todoService.findById(id)).thenReturn(java.util.Optional.empty());

        mockMvc.perform(get("/api/todos/" + id))
                .andExpect(status().isNotFound());
    }

    // T028 — US3: dueFilter query param

    @Test
    void shouldReturnFilteredTodosWhenDueFilterIsOverdue() throws Exception {
        // Given
        Todo overdue = buildTodo("Overdue task", Instant.parse("2026-06-07T12:00:00Z"));
        when(todoService.findAll(any(), any(), any(), any(), any())).thenReturn(List.of(overdue));

        // When / Then
        mockMvc.perform(get("/api/todos?dueFilter=overdue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Overdue task"));
    }

    @Test
    void shouldReturnFilteredTodosWhenDueFilterIsDueThisWeek() throws Exception {
        // Given
        Todo upcoming = buildTodo("Upcoming task", Instant.parse("2026-06-07T12:00:00Z"));
        when(todoService.findAll(any(), any(), any(), any(), any())).thenReturn(List.of(upcoming));

        // When / Then
        mockMvc.perform(get("/api/todos?dueFilter=due-this-week"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void shouldReturn400WhenDueFilterValueIsInvalid() throws Exception {
        mockMvc.perform(get("/api/todos?dueFilter=banana"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.dueFilter").exists());
    }

    // T008 — US1: due date in create/update

    @Test
    void shouldReturn201WithDueDateInResponseWhenDueDateProvided() throws Exception {
        // Given
        LocalDate dueDate = LocalDate.of(2026, 6, 15);
        Todo created = buildTodoWithDueDate("Buy milk", Instant.parse("2026-06-07T12:00:00Z"), dueDate);
        when(todoService.create(anyString(), any(), any())).thenReturn(created);

        // When / Then
        mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Buy milk\",\"dueDate\":\"2026-06-15\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dueDate").value("2026-06-15"));
    }

    @Test
    void shouldUpdateDueDateWhenPutRequestIncludesDueDate() throws Exception {
        // Given
        LocalDate dueDate = LocalDate.of(2026, 6, 20);
        Todo updated = buildTodoWithDueDate("Task", Instant.parse("2026-06-07T12:00:00Z"), dueDate);
        UUID id = updated.getId();
        when(todoService.update(eq(id), anyString(), any(), anyBoolean(), any())).thenReturn(updated);

        // When / Then
        mockMvc.perform(put("/api/todos/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Task\",\"completed\":false,\"dueDate\":\"2026-06-20\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").value("2026-06-20"));
    }

    @Test
    void shouldClearDueDateWhenPutRequestSendsNull() throws Exception {
        // Given
        Todo updated = buildTodo("Task", Instant.parse("2026-06-07T12:00:00Z"));
        UUID id = updated.getId();
        when(todoService.update(eq(id), anyString(), any(), anyBoolean(), any())).thenReturn(updated);

        // When / Then
        mockMvc.perform(put("/api/todos/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Task\",\"completed\":false,\"dueDate\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").doesNotExist());
    }
}
