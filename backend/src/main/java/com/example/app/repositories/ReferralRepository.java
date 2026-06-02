package com.example.app.repositories;

import com.example.app.models.Referral;
import com.example.app.models.ReferralStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReferralRepository extends JpaRepository<Referral, UUID> {
  List<Referral> findAllByOrderByCreatedAtDesc();

  List<Referral> findByStatusOrderByCreatedAtDesc(ReferralStatus status);
}
