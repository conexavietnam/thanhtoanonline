package com.example.app.dto.response;

import java.util.List;
import java.util.UUID;

public record InsightResponse(
        UUID id,
        String testCode,
        String category,
        String dimension,
        String summary,
        String keyBehaviors,
        String strengths,
        String weaknesses,
        String communicationStyle,
        String leadershipStyle,
        boolean active,
        List<String> allowedPlanCodes) {
}
