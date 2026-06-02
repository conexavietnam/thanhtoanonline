package com.example.app.services;

import com.example.app.dto.response.PartnerDashboardSummaryResponse;
import com.example.app.models.AppUser;
import com.example.app.repositories.AppUserRepository;
import com.example.app.repositories.PartnerDashboardRepository;
import com.example.app.utils.ApiException;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class PartnerDashboardService {
  private final AppUserRepository appUserRepository;
  private final PartnerDashboardRepository partnerDashboardRepository;

  public PartnerDashboardService(
      AppUserRepository appUserRepository,
      PartnerDashboardRepository partnerDashboardRepository) {
    this.appUserRepository = appUserRepository;
    this.partnerDashboardRepository = partnerDashboardRepository;
  }

  public PartnerDashboardSummaryResponse getSummaryByEmail(String email) {
    String normalized = email.toLowerCase(Locale.ROOT).trim();
    AppUser user = appUserRepository.findByEmailIgnoreCase(normalized)
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "NOT_AUTHENTICATED", "User not found"));

    return partnerDashboardRepository.summaryByUserId(user.getId());
  }
}
