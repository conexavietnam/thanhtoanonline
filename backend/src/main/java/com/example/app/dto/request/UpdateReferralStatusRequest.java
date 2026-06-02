package com.example.app.dto.request;

import com.example.app.models.ReferralStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateReferralStatusRequest(
    @NotNull ReferralStatus status
) {
}
