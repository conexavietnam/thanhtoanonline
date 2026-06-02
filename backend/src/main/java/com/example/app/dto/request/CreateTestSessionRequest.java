package com.example.app.dto.request;

import com.example.app.models.TestMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTestSessionRequest(
    @NotBlank @Size(max = 255) String takerName,
    @NotBlank @Size(max = 50) String testCode,
    @NotNull TestMode mode,
    @Size(max = 2000) String note
) {
}
