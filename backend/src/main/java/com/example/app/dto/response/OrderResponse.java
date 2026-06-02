package com.example.app.dto.response;

import java.time.Instant;
import java.util.UUID;

public record OrderResponse(
    UUID id,
    String packageCode,
    int credits,
    long amountVnd,
    String provider,
    String status,
    String externalTxnId,
    Instant createdAt,
    Instant updatedAt,
    String note
) {
}
