package com.example.app.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CheckoutRequest(
    @NotBlank @Size(max = 50) String planCode,
    @Size(max = 30) String phone,
    @Size(max = 255) String address,
    @Size(max = 30) String provider,
    @Size(max = 1000) String note
) {
}
