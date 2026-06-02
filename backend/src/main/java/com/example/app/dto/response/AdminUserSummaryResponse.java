package com.example.app.dto.response;

import java.time.Instant;
import java.util.UUID;

public record AdminUserSummaryResponse(
    UUID id,
    String email,
    String fullName,
    String role,
    String status,
    int credits,
    long referredCount,
    String referralCode,
    String referredByCode,
    Instant joinedAt
) {
}
