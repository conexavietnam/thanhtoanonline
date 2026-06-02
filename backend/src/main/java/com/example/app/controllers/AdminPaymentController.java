package com.example.app.controllers;

import com.example.app.dto.request.UpdateOrderStatusRequest;
import com.example.app.dto.response.PaymentResponse;
import com.example.app.models.OrderStatus;
import com.example.app.services.AdminPaymentService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {

  private final AdminPaymentService adminPaymentService;

  @GetMapping
  public List<PaymentResponse> list(@RequestParam(value = "status", required = false) OrderStatus status) {
    return adminPaymentService.list(status);
  }

  @GetMapping("/{id}")
  public PaymentResponse get(@PathVariable UUID id) {
    return adminPaymentService.get(id);
  }

  @PutMapping("/{id}/status")
  public PaymentResponse updateStatus(@PathVariable UUID id, @Valid @RequestBody UpdateOrderStatusRequest request) {
    return adminPaymentService.updateStatus(id, request);
  }
}
