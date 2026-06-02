package com.example.app.repositories;

import com.example.app.models.PaymentEvent;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentEventRepository extends JpaRepository<PaymentEvent, UUID> {
  List<PaymentEvent> findByOrderIdOrderByCreatedAtDesc(UUID orderId);
}
