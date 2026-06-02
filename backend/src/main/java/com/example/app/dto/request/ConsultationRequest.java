package com.example.app.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ConsultationRequest(
    @NotBlank @Size(max = 255) String name,
    @Size(max = 30) String phone,
    @Email @Size(max = 255) String email,
    @Size(max = 5000) String message
) {
}
