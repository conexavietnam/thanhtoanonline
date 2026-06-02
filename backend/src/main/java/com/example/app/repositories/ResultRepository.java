package com.example.app.repositories;

import com.example.app.models.Result;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResultRepository extends JpaRepository<Result, UUID> {
  Optional<Result> findBySessionId(UUID sessionId);

  boolean existsBySessionId(UUID sessionId);
}
