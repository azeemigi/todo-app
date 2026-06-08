package com.example.todoapi.model;

import com.fasterxml.jackson.annotation.JsonValue;

public enum DueFilter {
    OVERDUE("overdue"),
    DUE_THIS_WEEK("due-this-week");

    private final String value;

    DueFilter(String value) {
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
