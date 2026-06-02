package com.example.app.dto.response;

import java.time.Instant;
import java.util.UUID;

public record ReferralResponse(
    UUID id,
    String referrerEmail,
    String referrerFullName,
    String referredUserEmail,
    String referredUserFullName,
    String referralCode,
    String status,
    Double commissionPercentage,
    Long commissionAmount,
    Instant paidAt
) {
}
