package com.example.app.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateReferralCommissionRequest(
    @Min(0) @Max(100) Double commissionPercentage,
    @Min(0) Long commissionAmount
) {
}
