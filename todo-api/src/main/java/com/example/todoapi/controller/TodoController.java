package com.example.todoapi.controller;

import com.example.todoapi.dto.CreateTodoRequest;
import com.example.todoapi.dto.PatchTodoRequest;
import com.example.todoapi.dto.TodoResponse;
import com.example.todoapi.dto.UpdateTodoRequest;
import com.example.todoapi.service.TodoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public List<TodoResponse> getAllTodos() {
        return todoService.findAll().stream()
                .map(TodoResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TodoResponse createTodo(@Valid @RequestBody CreateTodoRequest request) {
        return TodoResponse.from(todoService.create(request.title(), request.description()));
    }

    @GetMapping("/{id}")
    public TodoResponse getTodoById(@PathVariable UUID id) {
        return todoService.findById(id)
                .map(TodoResponse::from)
                .orElseThrow(NoSuchElementException::new);
    }

    @PutMapping("/{id}")
    public TodoResponse updateTodo(@PathVariable UUID id, @Valid @RequestBody UpdateTodoRequest request) {
        return TodoResponse.from(
                todoService.update(id, request.title(), request.description(), request.completed())
        );
    }

    @PatchMapping("/{id}")
    public TodoResponse patchTodo(@PathVariable UUID id, @Valid @RequestBody PatchTodoRequest request) {
        return TodoResponse.from(todoService.patch(id, request.completed()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable UUID id) {
        todoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
