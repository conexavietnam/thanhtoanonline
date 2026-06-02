package com.example.app.dto.response;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UserMeResponse(
    UUID id,
    String email,
    String fullName,
    String status,
    List<String> roles,
    String referralCode,
    String referredByCode,
    int pdfExportCredits,
    String phoneNumber,
    LocalDate dateOfBirth,
    String gender,
    String address,
    ActiveSubscription activeSubscription
) {
  public record ActiveSubscription(
    String planCode,
    String planName,
    String status,
    Long price,
    String currency,
    Boolean preventPlanChange,
    String expiresAt
  ) {
  }
}
