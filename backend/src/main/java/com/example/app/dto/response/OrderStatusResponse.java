package com.example.app.dto.response;

import java.util.UUID;

public record OrderStatusResponse(
    UUID orderId,
    String status,
    String paymentReference,
    long amountVnd,
    String provider,
    String packageCode,
    int credits
) {}
