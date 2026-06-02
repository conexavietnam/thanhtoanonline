package com.example.app.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.UUID;

public record DiscResultDetailResponse(
    UUID sessionId,
    String takerName,
    String discPair,
    Instant completedAt,
    JsonNode coachingReport,
    JsonNode resultJson
) {
}
