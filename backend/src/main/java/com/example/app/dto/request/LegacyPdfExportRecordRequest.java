package com.example.app.dto.request;

import java.util.UUID;

public record LegacyPdfExportRecordRequest(
    UUID testSessionId,
    String exportType
) {
}
