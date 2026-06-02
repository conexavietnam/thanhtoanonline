package com.example.app.controllers;

import com.example.app.dto.response.OrderStatusResponse;
import com.example.app.models.Order;
import com.example.app.models.OrderStatus;
import com.example.app.repositories.OrderRepository;
import com.example.app.services.UserAccountService;
import com.example.app.utils.ApiException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me/orders")
@RequiredArgsConstructor
public class UserOrderController {
  private final OrderRepository orderRepository;
  private final UserAccountService userAccountService;

  @GetMapping("/{orderId}/status")
  public ResponseEntity<OrderStatusResponse> getOrderStatus(
      Authentication authentication,
      @PathVariable UUID orderId) {
    UUID userId = userAccountService.requireByEmail(authentication.getName()).getId();

    Order order = orderRepository.findByIdAndUserId(orderId, userId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));

    OrderStatusResponse response = new OrderStatusResponse(
        order.getId(),
        order.getStatus().name(),
        order.getId().toString(),
        order.getAmountVnd(),
        order.getProvider().name(),
        order.getCreditPackage().getCode(),
        order.getCreditPackage().getCredits());

    return ResponseEntity.ok(response);
  }
}
