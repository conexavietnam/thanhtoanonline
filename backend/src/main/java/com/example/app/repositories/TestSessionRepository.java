package com.example.app.repositories;

import com.example.app.models.SessionStatus;
import com.example.app.models.TestSession;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestSessionRepository extends JpaRepository<TestSession, UUID> {
  List<TestSession> findByOwnerUserIdOrderByCreatedAtDesc(UUID ownerUserId);

  List<TestSession> findByOwnerUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(UUID ownerUserId, Instant from, Instant to);

  List<TestSession> findByOwnerUserIdAndTakerNameContainingIgnoreCaseOrderByCreatedAtDesc(UUID ownerUserId, String takerName);

  Optional<TestSession> findByIdAndOwnerUserId(UUID id, UUID ownerUserId);

  long countByOwnerUserIdAndStatus(UUID ownerUserId, SessionStatus status);

  List<TestSession> findByOwnerUserIdAndStatusOrderByCreatedAtDesc(UUID ownerUserId, SessionStatus status);
}
