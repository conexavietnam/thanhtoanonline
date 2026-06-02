package com.example.app.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.UUID;

public record TestResultResponse(
    UUID sessionId,
    String summary,
    JsonNode resultJson
) {
}
