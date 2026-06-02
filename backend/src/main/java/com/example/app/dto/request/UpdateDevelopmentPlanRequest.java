package com.example.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateDevelopmentPlanRequest(
        @NotBlank @Size(max = 50) String testCode,
        @NotBlank @Size(max = 50) String dimension,
        @NotBlank String focusArea,
        @Size(max = 100) String timeline,
        String objectives,
        String actions,
        String resources,
        Boolean active,
        List<String> allowedPlanCodes) {
}
