package com.example.app.dto.response;

import java.time.Instant;
import java.util.UUID;

public record DiscTestHistoryItemResponse(
    UUID id,
    String testMode,
    Instant completedAt,
    String testTakerName
) {
}
