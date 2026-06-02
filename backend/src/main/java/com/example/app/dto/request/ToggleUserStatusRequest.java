package com.example.app.dto.request;

import jakarta.validation.constraints.NotNull;

public record ToggleUserStatusRequest(
    @NotNull Boolean suspended
) {
}
