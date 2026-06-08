package com.example.todoapi.controller;

import com.example.todoapi.dto.CreateTodoRequest;
import com.example.todoapi.dto.PatchTodoRequest;
import com.example.todoapi.dto.TodoResponse;
import com.example.todoapi.dto.UpdateTodoRequest;
import com.example.todoapi.exception.ErrorResponse;
import com.example.todoapi.exception.FieldError;
import com.example.todoapi.model.SortBy;
import com.example.todoapi.model.SortDir;
import com.example.todoapi.model.TodoStatus;
import com.example.todoapi.service.TodoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public ResponseEntity<Object> getAllTodos(
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        List<FieldError> errors = new ArrayList<>();

        TodoStatus statusEnum = parseEnum(TodoStatus.class, "status", status, errors);
        SortBy sortByEnum = parseEnum(SortBy.class, "sortBy", sortBy, errors);
        SortDir sortDirEnum = parseEnum(SortDir.class, "sortDir", sortDir, errors);

        if (!errors.isEmpty()) {
            return ResponseEntity.badRequest().body(new ErrorResponse(errors));
        }

        List<TodoResponse> result = todoService.findAll(statusEnum, q, sortByEnum, sortDirEnum).stream()
                .map(TodoResponse::from)
                .toList();
        return ResponseEntity.ok(result);
    }

    private <E extends Enum<E>> E parseEnum(Class<E> enumClass, String paramName, String value,
                                             List<FieldError> errors) {
        for (E constant : enumClass.getEnumConstants()) {
            if (constant.toString().equals(value)) {
                return constant;
            }
        }
        String accepted = Arrays.stream(enumClass.getEnumConstants())
                .map(Enum::toString)
                .collect(Collectors.joining(", "));
        errors.add(new FieldError(paramName,
                "Invalid value '" + value + "' for parameter '" + paramName + "'. Accepted values: " + accepted));
        return null;
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
