package com.example.app.dto.response;

import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(
    UUID id,
    String paymentReference,
    String provider,
    String currency,
    long amount,
    String status,
    Instant createdAt,
    Instant completedAt,
    String planName,
    String userEmail,
    String userFullName,
    String metadata,
    String note
) {
}
