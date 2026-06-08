package com.example.todoapi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateTodoRequest(
        @NotBlank @Size(min = 1, max = 200) String title,
        @Size(max = 1000) String description,
        LocalDate dueDate
) {}
