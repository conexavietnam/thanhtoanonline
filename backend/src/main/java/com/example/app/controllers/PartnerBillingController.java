package com.example.app.controllers;

import com.example.app.dto.request.CreateOrderRequest;
import com.example.app.dto.request.CreatePaymentRequest;
import com.example.app.dto.response.CreditPackageResponse;
import com.example.app.dto.response.CreditTransactionResponse;
import com.example.app.dto.response.OrderResponse;
import com.example.app.dto.response.PaymentRequestResponse;
import com.example.app.services.BillingService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/partner/billing")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PARTNER','ADMIN')")
public class PartnerBillingController {
  private final BillingService billingService;

  @GetMapping("/packages")
  public List<CreditPackageResponse> packages() {
    return billingService.listPackages();
  }

  @PostMapping("/orders")
  public OrderResponse createOrder(Authentication authentication, @Valid @RequestBody CreateOrderRequest request) {
    return billingService.createOrder(authentication.getName(), request);
  }

  @GetMapping("/orders")
  public List<OrderResponse> myOrders(Authentication authentication) {
    return billingService.listOrders(authentication.getName());
  }

  @PostMapping("/payments")
  public PaymentRequestResponse createPayment(Authentication authentication, @Valid @RequestBody CreatePaymentRequest request) {
    return billingService.createPaymentRequest(authentication.getName(), request);
  }

  @GetMapping("/credit-transactions")
  public List<CreditTransactionResponse> creditTransactions(Authentication authentication) {
    return billingService.listCreditTransactions(authentication.getName());
  }
}
