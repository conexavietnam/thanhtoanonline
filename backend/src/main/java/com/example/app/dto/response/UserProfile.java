package com.example.app.dto.response;

import com.example.app.models.AppUser;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

public record UserProfile(
    UUID id,
    String email,
    String fullName,
    String role,
    String status,
    int pdfExportCredits,
    @JsonProperty("pdfCredits") int legacyPdfCredits,
    String referralCode
) {
  public static UserProfile from(AppUser user) {
    int credits = user.getPdfCredits();
    return new UserProfile(
        user.getId(),
        user.getEmail(),
        user.getFullName(),
        user.getRole().name(),
        user.getStatus().name(),
        credits,
        credits,
        user.getReferralCode()
    );
  }
}
