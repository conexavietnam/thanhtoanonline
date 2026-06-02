package com.example.app.dto.response;

import java.time.Instant;
import java.util.UUID;

public record ReferralUserResponse(
    UUID id,
    String email,
    String fullName,
    Instant joinedAt
) {
}
