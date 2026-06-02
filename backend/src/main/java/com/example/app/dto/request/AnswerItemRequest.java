package com.example.app.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AnswerItemRequest(
    @NotNull UUID questionId,
    UUID optionId,
    @Min(1) @Max(5) Integer value
) {
}
