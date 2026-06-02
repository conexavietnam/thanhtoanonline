package com.example.app.controllers;

import com.example.app.dto.response.DiscResultDetailResponse;
import com.example.app.dto.response.DiscResultItemResponse;
import com.example.app.services.PartnerTestService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/partner/disc-results")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PARTNER','ADMIN')")
public class PartnerDiscController {
  private final PartnerTestService partnerTestService;

  @GetMapping
  public List<DiscResultItemResponse> list(Authentication authentication) {
    return partnerTestService.listDiscResults(authentication.getName());
  }

  @GetMapping("/{sessionId}")
  public DiscResultDetailResponse detail(Authentication authentication, @PathVariable UUID sessionId) {
    return partnerTestService.getDiscResultDetail(authentication.getName(), sessionId);
  }
}
