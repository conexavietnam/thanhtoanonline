package com.example.app.services;

import com.example.app.dto.response.PaymentResponse;
import com.example.app.dto.response.UserSubscriptionResponse;
import com.example.app.models.AppUser;
import com.example.app.models.Order;
import com.example.app.models.OrderStatus;
import com.example.app.repositories.OrderRepository;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserBillingService {
  private final OrderRepository orderRepository;
  private final UserAccountService userAccountService;

  @Transactional(readOnly = true)
  public List<PaymentResponse> listPayments(String email) {
    AppUser user = userAccountService.requireByEmail(email);
    return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
        .stream()
        .map(this::toPaymentResponse)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<UserSubscriptionResponse> listSubscriptions(String email) {
    AppUser user = userAccountService.requireByEmail(email);
    return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
        .stream()
        .map(this::toSubscriptionResponse)
        .collect(Collectors.toList());
  }

  private PaymentResponse toPaymentResponse(Order order) {
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

  private UserSubscriptionResponse toSubscriptionResponse(Order order) {
    String planCode = order.getCreditPackage() != null ? order.getCreditPackage().getCode() : "UNKNOWN";
    String planName = order.getCreditPackage() != null ? order.getCreditPackage().getName() : "Gói chưa đặt tên";
    String status = mapStatus(order.getStatus());
    return new UserSubscriptionResponse(
        order.getId(),
        planCode,
        planName,
        status,
        order.getCreatedAt(),
        null,
        order.getAmountVnd(),
        "VND"
    );
  }

  private String mapStatus(OrderStatus status) {
    if (status == null) {
      return "PENDING_PAYMENT";
    }
    return switch (status) {
      case COMPLETED -> "ACTIVE";
      case REFUNDED -> "CANCELLED";
      case CANCELLED -> "CANCELLED";
      case FAILED -> "FAILED";
      case PENDING -> "PENDING_PAYMENT";
    };
  }
}
