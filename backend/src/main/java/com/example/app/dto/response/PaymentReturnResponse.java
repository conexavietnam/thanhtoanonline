package com.example.app.dto.response;

public record PaymentReturnResponse(
    String status,
    String paymentReference
) {
}
