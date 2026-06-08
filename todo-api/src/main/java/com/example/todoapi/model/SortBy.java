package com.example.todoapi.model;

import com.fasterxml.jackson.annotation.JsonValue;

public enum SortBy {
    CREATED_AT("createdAt"),
    TITLE("title");

    private final String value;

    SortBy(String value) {
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
