package com.example.app.repositories;

import com.example.app.models.AppUser;
import com.example.app.models.RefreshToken;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
  Optional<RefreshToken> findByTokenHash(String tokenHash);

  List<RefreshToken> findByUserAndRevokedAtIsNull(AppUser user);
}
