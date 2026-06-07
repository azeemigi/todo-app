package com.example.todoapi.dto;

import jakarta.validation.constraints.NotNull;

public record PatchTodoRequest(@NotNull Boolean completed) {}
