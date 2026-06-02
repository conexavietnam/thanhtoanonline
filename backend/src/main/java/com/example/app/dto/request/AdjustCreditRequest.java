package com.example.app.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdjustCreditRequest(
    @NotNull Integer delta,
    @Size(max = 1000) String note
) {
}
