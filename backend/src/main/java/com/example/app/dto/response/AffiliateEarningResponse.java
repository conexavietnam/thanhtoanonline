package com.example.app.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AffiliateEarningResponse(
    UUID id,
    UUID orderId,
    String fromUserEmail,
    long amountVnd,
    BigDecimal percent,
    Instant createdAt,
    String note
) {
}
