package com.example.todoapi.controller;

import com.example.todoapi.dto.CreateTodoRequest;
import com.example.todoapi.dto.PatchTodoRequest;
import com.example.todoapi.dto.TodoResponse;
import com.example.todoapi.dto.UpdateTodoRequest;
import com.example.todoapi.exception.ErrorResponse;
import com.example.todoapi.model.DueFilter;
import com.example.todoapi.model.SortBy;
import com.example.todoapi.model.SortDir;
import com.example.todoapi.model.TodoStatus;
import com.example.todoapi.service.TodoService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private static final Logger log = LoggerFactory.getLogger(TodoController.class);

    private final TodoService todoService;

    public TodoController(TodoService todoService) {
        this.todoService = todoService;
    }

    @GetMapping
    public ResponseEntity<Object> getAllTodos(
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String dueFilter) {

        Map<String, String> fieldErrors = new LinkedHashMap<>();

        TodoStatus statusEnum = parseEnum(TodoStatus.class, "status", status, fieldErrors);
        SortBy sortByEnum = parseEnum(SortBy.class, "sortBy", sortBy, fieldErrors);
        SortDir sortDirEnum = parseEnum(SortDir.class, "sortDir", sortDir, fieldErrors);
        DueFilter dueFilterEnum = dueFilter != null
                ? parseEnum(DueFilter.class, "dueFilter", dueFilter, fieldErrors)
                : null;

        if (!fieldErrors.isEmpty()) {
            log.debug("Invalid filter params: {}", fieldErrors);
            return ResponseEntity.badRequest().body(ErrorResponse.ofValidation(fieldErrors));
        }

        log.debug("Fetching todos: status={}, q='{}', sortBy={}, sortDir={}, dueFilter={}", status, q, sortBy, sortDir, dueFilter);
        List<TodoResponse> result = todoService.findAll(statusEnum, q, sortByEnum, sortDirEnum, dueFilterEnum).stream()
                .map(TodoResponse::from)
                .toList();
        return ResponseEntity.ok(result);
    }

    private <E extends Enum<E>> E parseEnum(Class<E> enumClass, String paramName, String value,
                                             Map<String, String> errors) {
        for (E constant : enumClass.getEnumConstants()) {
            if (constant.toString().equals(value)) {
                return constant;
            }
        }
        String accepted = Arrays.stream(enumClass.getEnumConstants())
                .map(Enum::toString)
                .collect(Collectors.joining(", "));
        errors.put(paramName, "Invalid value '" + value + "'. Accepted values: " + accepted);
        return null;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TodoResponse createTodo(@Valid @RequestBody CreateTodoRequest request) {
        log.info("Creating todo: title='{}'", request.title());
        return TodoResponse.from(todoService.create(request.title(), request.description(), request.dueDate()));
    }

    @GetMapping("/{id}")
    public TodoResponse getTodoById(@PathVariable UUID id) {
        log.debug("Fetching todo by id: {}", id);
        return todoService.findById(id)
                .map(TodoResponse::from)
                .orElseThrow(NoSuchElementException::new);
    }

    @PutMapping("/{id}")
    public TodoResponse updateTodo(@PathVariable UUID id, @Valid @RequestBody UpdateTodoRequest request) {
        log.info("Updating todo: id={}", id);
        return TodoResponse.from(
                todoService.update(id, request.title(), request.description(), request.completed(), request.dueDate())
        );
    }

    @PatchMapping("/{id}")
    public TodoResponse patchTodo(@PathVariable UUID id, @Valid @RequestBody PatchTodoRequest request) {
        log.info("Patching todo: id={}, completed={}", id, request.completed());
        return TodoResponse.from(todoService.patch(id, request.completed()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable UUID id) {
        log.info("Deleting todo: id={}", id);
        todoService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
