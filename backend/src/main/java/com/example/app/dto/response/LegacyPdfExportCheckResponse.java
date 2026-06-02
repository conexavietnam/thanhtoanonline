package com.example.app.dto.response;

public record LegacyPdfExportCheckResponse(
    boolean canExport,
    int limit,
    int remaining,
    String exportType,
    String reportType,
    boolean canExportFree,
    int remainingFree,
    boolean canExportPaid,
    int remainingPaid
) {
}
