package com.example.todoapi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateTodoRequest(
        @NotBlank @Size(min = 1, max = 200) String title,
        @Size(max = 1000) String description,
        @NotNull Boolean completed
) {}
