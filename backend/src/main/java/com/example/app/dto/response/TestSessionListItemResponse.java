package com.example.app.dto.response;

import java.time.Instant;
import java.util.UUID;

public record TestSessionListItemResponse(
    UUID id,
    String testCode,
    String mode,
    String status,
    String takerName,
    Instant createdAt,
    Instant completedAt,
    long costVnd,
    int progressPercent,
    long exportCount,
    String latestExportStatus,
    String latestExportFileUrl,
    Integer creditsAfterLatestExport,
    String exportNote
) {
}
