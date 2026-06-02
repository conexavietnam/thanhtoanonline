package com.example.app.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreatePaymentRequest(
    @NotNull UUID orderId
) {
}
