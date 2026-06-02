package com.example.app.repositories;

import com.example.app.models.AppUser;
import com.example.app.models.UserRole;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
  Optional<AppUser> findByEmail(String email);

  boolean existsByEmail(String email);

  Optional<AppUser> findByEmailIgnoreCase(String email);

  boolean existsByEmailIgnoreCase(String email);

  Optional<AppUser> findByReferralCode(String referralCode);

  boolean existsByReferralCode(String referralCode);

  long countByReferredByCode(String referredByCode);

  List<AppUser> findTop200ByRoleOrderByCreatedAtDesc(UserRole role);

  long countByRole(UserRole role);

  List<AppUser> findTop500ByReferredByCodeOrderByCreatedAtDesc(String referredByCode);
}
