package com.example.app.dto.response;

import java.time.Instant;
import java.util.UUID;

public record UserSubscriptionResponse(
    UUID id,
    String planCode,
    String planName,
    String status,
    Instant startsAt,
    Instant expiresAt,
    long price,
    String currency
) {
}
