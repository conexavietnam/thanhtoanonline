package com.example.app.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "referrals")
@Getter
@Setter
@NoArgsConstructor
public class Referral {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "referrer_user_id")
  private AppUser referrer;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "referred_user_id")
  private AppUser referredUser;

  @Column(name = "referrer_email")
  private String referrerEmail;

  @Column(name = "referrer_full_name")
  private String referrerFullName;

  @Column(name = "referred_user_email")
  private String referredUserEmail;

  @Column(name = "referred_user_full_name")
  private String referredUserFullName;

  @Column(name = "referral_code", nullable = false, length = 50)
  private String referralCode;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(columnDefinition = "referral_status", nullable = false)
  private ReferralStatus status = ReferralStatus.PENDING;

  @Column(name = "commission_percentage", precision = 10, scale = 2)
  private BigDecimal commissionPercentage;

  @Column(name = "commission_amount_vnd")
  private Long commissionAmountVnd;

  @Column(name = "paid_at")
  private Instant paidAt;

  @Column(columnDefinition = "TEXT")
  private String note;

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    if (createdAt == null) createdAt = now;
    if (updatedAt == null) updatedAt = now;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }
}
