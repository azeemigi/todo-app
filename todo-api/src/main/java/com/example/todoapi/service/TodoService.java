package com.example.todoapi.service;

import com.example.todoapi.model.Todo;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TodoService {

    private final ConcurrentHashMap<UUID, Todo> store = new ConcurrentHashMap<>();

    public List<Todo> findAll() {
        return store.values().stream()
                .sorted(Comparator.comparing(Todo::getCreatedAt).reversed())
                .toList();
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
