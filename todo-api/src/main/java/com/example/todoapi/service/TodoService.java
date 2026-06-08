package com.example.todoapi.service;

import com.example.todoapi.model.SortBy;
import com.example.todoapi.model.SortDir;
import com.example.todoapi.model.Todo;
import com.example.todoapi.model.TodoStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(TodoService.class);

    private final ConcurrentHashMap<UUID, Todo> store = new ConcurrentHashMap<>();

    public List<Todo> findAll(TodoStatus status, String q, SortBy sortBy, SortDir sortDir) {
        Stream<Todo> stream = store.values().stream();

        stream = switch (status) {
            case ACTIVE -> stream.filter(t -> !t.isCompleted());
            case COMPLETED -> stream.filter(Todo::isCompleted);
            case ALL -> stream;
        };

        if (q != null && !q.isBlank()) {
            String lowerQ = q.trim().toLowerCase();
            stream = stream.filter(t ->
                    t.getTitle().toLowerCase().contains(lowerQ)
                    || (t.getDescription() != null && t.getDescription().toLowerCase().contains(lowerQ))
            );
        }

        Comparator<Todo> comparator = switch (sortBy) {
            case TITLE -> Comparator.comparing(t -> t.getTitle().toLowerCase());
            case CREATED_AT -> Comparator.comparing(Todo::getCreatedAt);
        };
        if (sortDir == SortDir.DESC) {
            comparator = comparator.reversed();
        }

        List<Todo> result = stream.sorted(comparator).toList();
        log.debug("findAll returned {} todos (status={}, q='{}', sortBy={}, sortDir={})",
                result.size(), status, q, sortBy, sortDir);
        return result;
    }

    public Optional<Todo> findById(UUID id) {
        log.debug("findById: {}", id);
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
        log.info("Created todo: id={}, title='{}'", todo.getId(), todo.getTitle());
        return todo;
    }

    public Todo update(UUID id, String title, String description, boolean completed) {
        Todo todo = store.get(id);
        if (todo == null) throw new NoSuchElementException();
        todo.setTitle(title);
        todo.setDescription(description);
        todo.setCompleted(completed);
        todo.setUpdatedAt(Instant.now());
        log.info("Updated todo: id={}, completed={}", id, completed);
        return todo;
    }

    public Todo patch(UUID id, boolean completed) {
        Todo todo = store.get(id);
        if (todo == null) throw new NoSuchElementException();
        todo.setCompleted(completed);
        todo.setUpdatedAt(Instant.now());
        log.info("Patched todo: id={}, completed={}", id, completed);
        return todo;
    }

    public void delete(UUID id) {
        if (!store.containsKey(id)) throw new NoSuchElementException();
        store.remove(id);
        log.info("Deleted todo: id={}", id);
    }
}
