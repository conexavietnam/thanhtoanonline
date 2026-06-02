package com.example.app.controllers;

import com.example.app.dto.response.PartnerDashboardSummaryResponse;
import com.example.app.services.PartnerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/partners/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PARTNER','ADMIN')")
public class PartnerDashboardController {

  private final PartnerDashboardService partnerDashboardService;

  @GetMapping
  public PartnerDashboardSummaryResponse getDashboard(org.springframework.security.core.Authentication authentication) {
    return partnerDashboardService.getSummaryByEmail(authentication.getName());
  }
}
