package com.example.app.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateCareerRequest(
        @NotBlank @Size(max = 50) String testCode,
        @NotBlank @Size(max = 50) String primaryDimension,
        @Size(max = 50) String secondaryDimension,
        @NotBlank String jobTitle,
        @Min(0) @Max(100) int matchLevel,
        String summary,
        String skills,
        String learningResources,
        Boolean active,
        List<String> allowedPlanCodes) {
}
