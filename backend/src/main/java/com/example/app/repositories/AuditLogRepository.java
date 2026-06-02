package com.example.app.repositories;

import com.example.app.models.AuditActionType;
import com.example.app.models.AuditLog;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
  Page<AuditLog> findAllBy(Pageable pageable);

  Page<AuditLog> findByUserId(UUID userId, Pageable pageable);

  Page<AuditLog> findByActionType(AuditActionType actionType, Pageable pageable);

  Page<AuditLog> findByEntityTypeIgnoreCase(String entityType, Pageable pageable);

  Page<AuditLog> findByCreatedAtBetween(Instant start, Instant end, Pageable pageable);

  Page<AuditLog> findByUserIdAndCreatedAtBetween(UUID userId, Instant start, Instant end, Pageable pageable);
}
