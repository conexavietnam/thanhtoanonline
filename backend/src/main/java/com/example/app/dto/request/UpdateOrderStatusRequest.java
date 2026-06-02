package com.example.app.dto.request;

import com.example.app.models.OrderStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateOrderStatusRequest(
    @NotNull OrderStatus status,
    @Size(max = 1000) String note
) {
}
