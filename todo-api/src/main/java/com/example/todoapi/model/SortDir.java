package com.example.todoapi.model;

import com.fasterxml.jackson.annotation.JsonValue;

public enum SortDir {
    DESC("desc"),
    ASC("asc");

    private final String value;

    SortDir(String value) {
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
