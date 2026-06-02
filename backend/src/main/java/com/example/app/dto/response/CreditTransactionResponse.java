package com.example.app.dto.response;

import java.time.Instant;
import java.util.UUID;

public record CreditTransactionResponse(
    Instant createdAt,
    String type,
    int delta,
    int creditsAfter,
    Long amountVnd,
    String refType,
    UUID refId,
    String note
) {
}
