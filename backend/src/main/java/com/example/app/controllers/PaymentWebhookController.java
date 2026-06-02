package com.example.app.controllers;

import com.example.app.dto.request.PaymentCallbackRequest;
import com.example.app.dto.response.OrderResponse;
import com.example.app.services.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/payments")
@RequiredArgsConstructor
public class PaymentWebhookController {
  private final BillingService billingService;

  @PostMapping("/callback")
  public OrderResponse callback(@Valid @RequestBody PaymentCallbackRequest request) {
    return billingService.paymentCallback(request);
  }
}
