package com.example.app.controllers;

import com.example.app.dto.response.AffiliateEarningResponse;
import com.example.app.dto.response.AffiliateSummaryResponse;
import com.example.app.dto.response.ReferralUserResponse;
import com.example.app.services.AffiliateService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/partner/affiliate")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PARTNER','ADMIN')")
public class PartnerAffiliateController {
  private final AffiliateService affiliateService;

  @GetMapping("/summary")
  public AffiliateSummaryResponse summary(Authentication authentication) {
    return affiliateService.summary(authentication.getName());
  }

  @GetMapping("/earnings")
  public List<AffiliateEarningResponse> earnings(Authentication authentication) {
    return affiliateService.earnings(authentication.getName());
  }

  @GetMapping("/referrals")
  public List<ReferralUserResponse> referrals(Authentication authentication) {
    return affiliateService.referredUsers(authentication.getName());
  }
}
