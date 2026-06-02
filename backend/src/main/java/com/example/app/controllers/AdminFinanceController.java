package com.example.app.controllers;

import com.example.app.dto.request.UpdateAffiliatePercentRequest;
import com.example.app.dto.request.UpdateOrderStatusRequest;
import com.example.app.dto.response.AdminOverviewResponse;
import com.example.app.dto.response.MessageResponse;
import com.example.app.dto.response.OrderResponse;
import com.example.app.models.OrderStatus;
import com.example.app.services.AdminFinanceService;
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
@RequestMapping("/api/admin/finance")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminFinanceController {
  private final AdminFinanceService adminFinanceService;

  @GetMapping("/orders")
  public List<OrderResponse> orders(@RequestParam(value = "status", required = false) OrderStatus status) {
    return adminFinanceService.listOrders(status);
  }

  @PutMapping("/orders/{orderId}/status")
  public OrderResponse updateOrderStatus(
      @PathVariable UUID orderId,
      @Valid @RequestBody UpdateOrderStatusRequest request) {
    return adminFinanceService.updateOrderStatus(orderId, request);
  }

  @PutMapping("/affiliate/percent")
  public MessageResponse updateAffiliatePercent(@Valid @RequestBody UpdateAffiliatePercentRequest request) {
    adminFinanceService.updateAffiliatePercent(request);
    return new MessageResponse("Affiliate percent updated");
  }

  @GetMapping("/overview")
  public AdminOverviewResponse overview() {
    return adminFinanceService.overview();
  }
}
