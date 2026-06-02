package com.example.app.repositories;

import com.example.app.models.CreditTransaction;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreditTransactionRepository extends JpaRepository<CreditTransaction, UUID> {
  List<CreditTransaction> findByUserIdOrderByCreatedAtDesc(UUID userId);

  boolean existsByRefTypeAndRefIdAndType(String refType, UUID refId, com.example.app.models.CreditTxType type);
}
