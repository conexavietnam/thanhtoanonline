package com.example.app.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

public record TestSessionDetailResponse(
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
    int progressPercent,
    long exportCount,
    String latestExportStatus,
    String latestExportFileUrl,
    Integer creditsAfterLatestExport,
    String exportNote,
    String summary,
    JsonNode resultJson
) {
}
