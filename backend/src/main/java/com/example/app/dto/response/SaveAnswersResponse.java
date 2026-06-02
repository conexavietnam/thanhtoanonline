package com.example.app.dto.response;

import java.util.UUID;

public record SaveAnswersResponse(
    UUID sessionId,
    long answeredCount,
    long totalQuestions,
    int progressPercent,
    String message
) {
}
