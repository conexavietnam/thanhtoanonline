package com.example.app.repositories;

import com.example.app.models.PasswordReset;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, UUID> {
  Optional<PasswordReset> findByTokenHash(String tokenHash);
}
