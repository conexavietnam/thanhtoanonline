package com.example.app.repositories;

import com.example.app.models.Order;
import com.example.app.models.OrderStatus;
import com.example.app.models.PaymentProvider;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

public interface OrderRepository extends JpaRepository<Order, UUID> {
  List<Order> findByUserIdOrderByCreatedAtDesc(UUID userId);

  List<Order> findTop300ByOrderByCreatedAtDesc();

  List<Order> findTop300ByStatusOrderByCreatedAtDesc(OrderStatus status);

  @EntityGraph(attributePaths = "creditPackage")
  Optional<Order> findByIdAndUserId(UUID orderId, UUID userId);

  @EntityGraph(attributePaths = {"creditPackage", "user"})
  Optional<Order> findByIdWithCreditPackageAndUser(UUID orderId);

  Optional<Order> findFirstByUserIdAndCreditPackageIdAndProviderAndStatusOrderByCreatedAtDesc(
      UUID userId,
      UUID creditPackageId,
      PaymentProvider provider,
      OrderStatus status);

  Optional<Order> findByExternalTxnId(String externalTxnId);

  boolean existsByCreditPackageId(UUID packageId);

  List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);
}
