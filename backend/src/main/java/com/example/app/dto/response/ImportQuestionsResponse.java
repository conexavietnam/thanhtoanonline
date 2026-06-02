package com.example.app.dto.response;

public record ImportQuestionsResponse(
    int createdCount,
    int updatedCount,
    int skippedCount,
    int totalRows
) {
}
