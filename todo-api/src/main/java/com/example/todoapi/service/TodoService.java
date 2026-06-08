package com.example.todoapi.service;

import com.example.todoapi.model.SortBy;
import com.example.todoapi.model.SortDir;
import com.example.todoapi.model.Todo;
import com.example.todoapi.model.TodoStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

@Service
public class TodoService {

    private final ConcurrentHashMap<UUID, Todo> store = new ConcurrentHashMap<>();

    public List<Todo> findAll(TodoStatus status, String q, SortBy sortBy, SortDir sortDir) {
        Stream<Todo> stream = store.values().stream();

        // Status filter
        if (status == TodoStatus.ACTIVE) {
            stream = stream.filter(t -> !t.isCompleted());
        } else if (status == TodoStatus.COMPLETED) {
            stream = stream.filter(Todo::isCompleted);
        }

        // Text search (case-insensitive, blank/null = no filter)
        if (q != null && !q.isBlank()) {
            String lowerQ = q.trim().toLowerCase();
            stream = stream.filter(t ->
                    t.getTitle().toLowerCase().contains(lowerQ)
                    || (t.getDescription() != null && t.getDescription().toLowerCase().contains(lowerQ))
            );
        }

        // Sort
        Comparator<Todo> comparator;
        if (sortBy == SortBy.TITLE) {
            comparator = Comparator.comparing(t -> t.getTitle().toLowerCase());
        } else {
            comparator = Comparator.comparing(Todo::getCreatedAt);
        }
        if (sortDir == SortDir.DESC) {
            comparator = comparator.reversed();
        }

        return stream.sorted(comparator).toList();
    }

    public Optional<Todo> findById(UUID id) {
        return Optional.ofNullable(store.get(id));
    }

    public Todo create(String title, String description) {
        Todo todo = new Todo();
        todo.setId(UUID.randomUUID());
        todo.setTitle(title);
        todo.setDescription(description);
        todo.setCompleted(false);
        Instant now = Instant.now();
        todo.setCreatedAt(now);
        todo.setUpdatedAt(now);
        store.put(todo.getId(), todo);
        return todo;
    }

    public Todo update(UUID id, String title, String description, boolean completed) {
        Todo todo = store.get(id);
        if (todo == null) throw new NoSuchElementException();
        todo.setTitle(title);
        todo.setDescription(description);
        todo.setCompleted(completed);
        todo.setUpdatedAt(Instant.now());
        return todo;
    }

    public Todo patch(UUID id, boolean completed) {
        Todo todo = store.get(id);
        if (todo == null) throw new NoSuchElementException();
        todo.setCompleted(completed);
        todo.setUpdatedAt(Instant.now());
        return todo;
    }

    public void delete(UUID id) {
        if (!store.containsKey(id)) throw new NoSuchElementException();
        store.remove(id);
    }
}
