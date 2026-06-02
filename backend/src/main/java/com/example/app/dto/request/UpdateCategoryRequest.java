package com.example.app.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateCategoryRequest(
    @NotBlank @Size(max = 50) String testCode,
    @NotBlank @Size(max = 255) String name,
    @NotNull @Min(0) @Max(100) Integer weightPercent
) {
}
