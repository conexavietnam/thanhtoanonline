package com.example.app.repositories;

import com.example.app.models.CreditPackage;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreditPackageRepository extends JpaRepository<CreditPackage, UUID> {
  List<CreditPackage> findByIsActiveTrueOrderByPriceVndAsc();

  Optional<CreditPackage> findByCode(String code);
}
