package com.example.app.repositories;

import com.example.app.models.AffiliateEarning;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AffiliateEarningRepository extends JpaRepository<AffiliateEarning, UUID> {
  List<AffiliateEarning> findByPartnerUserIdOrderByCreatedAtDesc(UUID partnerUserId);

  List<AffiliateEarning> findByOrderId(UUID orderId);
}
