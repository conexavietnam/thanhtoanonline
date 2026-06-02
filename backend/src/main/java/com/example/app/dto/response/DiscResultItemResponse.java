package com.example.app.dto.response;

import java.time.Instant;
import java.util.UUID;

public record DiscResultItemResponse(
    UUID sessionId,
    String takerName,
    String discPair,
    Instant completedAt
) {
}
