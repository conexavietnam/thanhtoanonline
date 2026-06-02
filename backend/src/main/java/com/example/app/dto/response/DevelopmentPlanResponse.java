package com.example.app.dto.response;

import java.util.List;
import java.util.UUID;

public record DevelopmentPlanResponse(
        UUID id,
        String testCode,
        String dimension,
        String focusArea,
        String timeline,
        String objectives,
        String actions,
        String resources,
        boolean active,
        List<String> allowedPlanCodes) {
}
