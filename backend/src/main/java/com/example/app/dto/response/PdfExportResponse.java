package com.example.app.dto.response;

import java.time.Instant;
import java.util.UUID;

public record PdfExportResponse(
    UUID id,
    UUID sessionId,
    String takerName,
    Instant testDate,
    long costVnd,
    String mode,
    String status,
    String fileUrl,
    String errorText,
    Integer creditsAfterExport,
    String note,
    Instant createdAt
) {
}
