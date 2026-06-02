package com.example.app.dto.request;

import jakarta.validation.constraints.Size;

public record GoogleLoginRequest(
    @Size(max = 4096) String idToken,
    @Size(max = 2048) String code,
    @Size(max = 512) String redirectUri,
    @Size(max = 32) String referralCode
) {
}
