package com.example.app.dto.response;

import com.example.app.models.AppUser;

public record AuthResponse(String accessToken, String tokenType, String refreshToken, UserProfile user) {
  public static AuthResponse of(AppUser user, String accessToken, String refreshToken) {
    return new AuthResponse(accessToken, "Bearer", refreshToken, UserProfile.from(user));
  }
}
