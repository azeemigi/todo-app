package com.example.todoapi.controller;

import com.example.todoapi.model.Todo;
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

    @Test
    void getAllTodos_returnsEmptyList() throws Exception {
        when(todoService.findAll()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/todos"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void getAllTodos_returnsTodosNewestFirst() throws Exception {
        Todo older = buildTodo("Older", Instant.parse("2026-06-07T09:00:00Z"));
        Todo newer = buildTodo("Newer", Instant.parse("2026-06-07T10:00:00Z"));
        when(todoService.findAll()).thenReturn(List.of(newer, older));

        mockMvc.perform(get("/api/todos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Newer"))
                .andExpect(jsonPath("$[1].title").value("Older"));
    }

    // --- Phase 4: US2 Create TODO ---

    @Test
    void createTodo_returnsCreated() throws Exception {
        Todo created = buildTodo("Buy milk", Instant.parse("2026-06-07T12:00:00Z"));
        when(todoService.create(anyString(), any())).thenReturn(created);

        mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Buy milk\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Buy milk"));
    }

    @Test
    void createTodo_blankTitle_returns400() throws Exception {
        mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").exists());
    }

    @Test
    void createTodo_titleTooLong_returns400() throws Exception {
        String longTitle = "x".repeat(201);
        mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"" + longTitle + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createTodo_descriptionTooLong_returns400() throws Exception {
        String longDesc = "y".repeat(1001);
        mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Valid\",\"description\":\"" + longDesc + "\"}"))
                .andExpect(status().isBadRequest());
    }

    // --- Phase 5: US3 Toggle Complete ---

    @Test
    void patchTodo_marksComplete() throws Exception {
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
    void patchTodo_marksIncomplete() throws Exception {
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
    void patchTodo_notFound_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(todoService.patch(eq(id), anyBoolean()))
                .thenThrow(new java.util.NoSuchElementException());

        mockMvc.perform(patch("/api/todos/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"completed\":true}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void patchTodo_missingCompleted_returns400() throws Exception {
        mockMvc.perform(patch("/api/todos/" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // --- Phase 6: US4 Edit TODO ---

    @Test
    void updateTodo_returnsUpdated() throws Exception {
        Todo updated = buildTodo("Updated title", Instant.parse("2026-06-07T12:00:00Z"));
        UUID id = updated.getId();
        when(todoService.update(eq(id), anyString(), any(), anyBoolean())).thenReturn(updated);

        mockMvc.perform(put("/api/todos/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Updated title\",\"completed\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated title"));
    }

    @Test
    void updateTodo_notFound_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(todoService.update(eq(id), anyString(), any(), anyBoolean()))
                .thenThrow(new java.util.NoSuchElementException());

        mockMvc.perform(put("/api/todos/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"X\",\"completed\":false}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateTodo_blankTitle_returns400() throws Exception {
        mockMvc.perform(put("/api/todos/" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"\",\"completed\":false}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateTodo_missingCompleted_returns400() throws Exception {
        mockMvc.perform(put("/api/todos/" + UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Valid\"}"))
                .andExpect(status().isBadRequest());
    }

    // --- Phase 7: US5 Delete TODO ---

    @Test
    void deleteTodo_returnsNoContent() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/todos/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteTodo_notFound_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        org.mockito.Mockito.doThrow(new java.util.NoSuchElementException())
                .when(todoService).delete(eq(id));

        mockMvc.perform(delete("/api/todos/" + id))
                .andExpect(status().isNotFound());
    }

    // --- Phase 8: GET /api/todos/{id} ---

    @Test
    void getTodoById_returnsItem() throws Exception {
        Todo todo = buildTodo("Single", Instant.parse("2026-06-07T12:00:00Z"));
        UUID id = todo.getId();
        when(todoService.findById(id)).thenReturn(java.util.Optional.of(todo));

        mockMvc.perform(get("/api/todos/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Single"));
    }

    @Test
    void getTodoById_notFound_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(todoService.findById(id)).thenReturn(java.util.Optional.empty());

        mockMvc.perform(get("/api/todos/" + id))
                .andExpect(status().isNotFound());
    }
}
