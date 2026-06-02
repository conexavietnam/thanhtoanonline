package com.example.app.dto.response;

import java.util.UUID;

public record AdminCategoryResponse(
    UUID id,
    String testCode,
    String name,
    int weightPercent
) {
}
