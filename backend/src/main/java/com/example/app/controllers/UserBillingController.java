package com.example.app.controllers;

import com.example.app.dto.response.PaymentResponse;
import com.example.app.dto.response.UserSubscriptionResponse;
import com.example.app.services.UserBillingService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class UserBillingController {

  private final UserBillingService userBillingService;

  @GetMapping("/payments")
  public List<PaymentResponse> myPayments(Authentication authentication) {
    return userBillingService.listPayments(authentication.getName());
  }

  @GetMapping("/subscriptions")
  public List<UserSubscriptionResponse> mySubscriptions(Authentication authentication) {
    return userBillingService.listSubscriptions(authentication.getName());
  }
}
