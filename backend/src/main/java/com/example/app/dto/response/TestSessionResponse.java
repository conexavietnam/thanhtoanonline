package com.example.app.dto.response;

import java.time.Instant;
import java.util.UUID;

public record TestSessionResponse(
    UUID id,
    String testCode,
    String mode,
    String status,
    String takerName,
    Instant startedAt,
    Instant completedAt,
    long costVnd,
    long answeredCount,
    long totalQuestions,
    int progressPercent
) {
}
