package com.example.app.repositories;

import com.example.app.models.AffiliateConfig;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AffiliateConfigRepository extends JpaRepository<AffiliateConfig, UUID> {
  Optional<AffiliateConfig> findFirstByIsActiveTrueOrderByCreatedAtDesc();

  List<AffiliateConfig> findByIsActiveTrueOrderByCreatedAtDesc();
}
