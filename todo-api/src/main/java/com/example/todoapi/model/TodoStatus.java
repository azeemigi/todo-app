package com.example.todoapi.model;

import com.fasterxml.jackson.annotation.JsonValue;

public enum TodoStatus {
    ALL("all"),
    ACTIVE("active"),
    COMPLETED("completed");

    private final String value;

    TodoStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }
}
