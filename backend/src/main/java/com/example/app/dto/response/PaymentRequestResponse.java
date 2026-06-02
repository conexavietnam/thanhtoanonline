package com.example.app.dto.response;

import java.util.UUID;

public record PaymentRequestResponse(
    UUID orderId,
    String provider,
    String paymentUrl,
    String message
) {
}
