package com.example.todoapi.exception;

import java.util.List;

public record ErrorResponse(List<FieldError> errors) {}
