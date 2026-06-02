package com.example.app.dto.response;

import java.util.UUID;

public record CheckoutResponse(
    UUID orderId,
    String paymentReference,
    String status,
    String paymentUrl,
    Payment payment
) {
  public record Payment(
      long amount,
      String provider,
      String status
  ) {
  }
}
