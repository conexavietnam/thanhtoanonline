package com.example.app.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class AppUser {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "auth_provider", columnDefinition = "auth_provider", nullable = false)
  private AuthProvider authProvider = AuthProvider.EMAIL;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(name = "password_hash")
  private String passwordHash;

  @Column(name = "full_name", nullable = false)
  private String fullName = "";

  @Column(name = "avatar_url")
  private String avatarUrl;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(columnDefinition = "user_role", nullable = false)
  // Quốc Trí: role mặc định của user mới là USER, partner chỉ được nâng quyền qua luồng admin.
  private UserRole role = UserRole.USER;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(columnDefinition = "user_status", nullable = false)
  private UserStatus status = UserStatus.PENDING_VERIFICATION;

  @Column(name = "email_verified", nullable = false)
  private boolean emailVerified = false;

  @Column(name = "pdf_credits", nullable = false)
  private int pdfCredits = 0;

  @Column(name = "referral_code")
  private String referralCode;

  @Column(name = "referred_by_code")
  private String referredByCode;

  @Column(name = "phone_number")
  private String phoneNumber;

  @Column(name = "date_of_birth")
  private LocalDate dateOfBirth;

  @Column(name = "gender", length = 20)
  private String gender;

  @Column(name = "address")
  private String address;

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    if (createdAt == null) {
      createdAt = now;
    }
    if (updatedAt == null) {
      updatedAt = now;
    }
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }
}
