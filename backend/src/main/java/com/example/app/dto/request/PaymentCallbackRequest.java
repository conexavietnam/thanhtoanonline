package com.example.app.dto.request;

import com.example.app.models.PaymentProvider;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PaymentCallbackRequest(
    @NotNull UUID orderId,
    @NotNull PaymentProvider provider,
    @NotBlank String eventType,
    boolean verified,
    String externalTxnId,
    JsonNode payload
) {
}
