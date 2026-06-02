package com.example.app.dto.response;

import java.util.List;
import java.util.UUID;

public record CareerResponse(
        UUID id,
        String testCode,
        String primaryDimension,
        String secondaryDimension,
        String jobTitle,
        int matchLevel,
        String summary,
        String skills,
        String learningResources,
        boolean active,
        List<String> allowedPlanCodes) {
}
