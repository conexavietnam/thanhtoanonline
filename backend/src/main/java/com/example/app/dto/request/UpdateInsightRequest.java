package com.example.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateInsightRequest(
        @NotBlank @Size(max = 50) String testCode,
        @NotBlank @Size(max = 100) String category,
        @NotBlank @Size(max = 50) String dimension,
        String summary,
        String keyBehaviors,
        String strengths,
        String weaknesses,
        String communicationStyle,
        String leadershipStyle,
        Boolean active,
        List<String> allowedPlanCodes) {
}
