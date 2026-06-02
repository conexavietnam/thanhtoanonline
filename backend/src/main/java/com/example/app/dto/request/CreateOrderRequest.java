package com.example.app.dto.request;

import com.example.app.models.PaymentProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateOrderRequest(
    @NotBlank @Size(max = 50) String packageCode,
    @NotNull PaymentProvider provider,
    @Size(max = 1000) String note
) {
}
