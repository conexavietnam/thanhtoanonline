package com.example.app.services;

import com.example.app.dto.request.UpdateOrderStatusRequest;
import com.example.app.dto.response.PaymentResponse;
import com.example.app.models.Order;
import com.example.app.models.OrderStatus;
import com.example.app.repositories.OrderRepository;
import com.example.app.utils.ApiException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminPaymentService {

  private final OrderRepository orderRepository;
  private final BillingService billingService;

  public List<PaymentResponse> list(OrderStatus status) {
    List<Order> orders = status == null
        ? orderRepository.findAll()
        : orderRepository.findByStatusOrderByCreatedAtDesc(status);
    return orders.stream().map(this::toResponse).collect(Collectors.toList());
  }

  public PaymentResponse get(UUID id) {
    Order order = orderRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));
    return toResponse(order);
  }

  @Transactional
  public PaymentResponse updateStatus(UUID id, UpdateOrderStatusRequest request) {
    billingService.markOrderStatus(id, request.status(), request.note());
    Order order = orderRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));
    return toResponse(order);
  }

  private PaymentResponse toResponse(Order order) {
    String paymentRef = order.getExternalTxnId() != null ? order.getExternalTxnId() : order.getId().toString();
    String planName = order.getCreditPackage() != null ? order.getCreditPackage().getName() : null;
    String userEmail = order.getUser() != null ? order.getUser().getEmail() : null;
    String userFullName = order.getUser() != null ? order.getUser().getFullName() : null;
    Instant completedAt = order.getStatus() == OrderStatus.COMPLETED ? order.getUpdatedAt() : null;
    String metadata = order.getExternalPayload() != null ? order.getExternalPayload().toString() : null;
    return new PaymentResponse(
        order.getId(),
        paymentRef,
        order.getProvider().name(),
        "VND",
        order.getAmountVnd(),
        order.getStatus().name(),
        order.getCreatedAt(),
        completedAt,
        planName,
        userEmail,
        userFullName,
        metadata,
        order.getNote()
    );
  }
}
