package com.example.app.dto.request;

import jakarta.validation.constraints.NotBlank;

public record ImportQuestionsRequest(
    @NotBlank String csv
) {
}
