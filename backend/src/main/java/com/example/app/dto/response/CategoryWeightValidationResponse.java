package com.example.app.dto.response;

public record CategoryWeightValidationResponse(
    String testCode,
    int totalWeight,
    boolean valid
) {
}
