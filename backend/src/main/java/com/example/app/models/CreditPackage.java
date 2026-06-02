package com.example.app.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.fasterxml.jackson.databind.JsonNode;

@Entity
@Table(name = "credit_packages")
@Getter
@Setter
@NoArgsConstructor
public class CreditPackage {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(nullable = false, unique = true, length = 50)
  private String code;

  @Column(nullable = false)
  private int credits;

  @Column(name = "price_vnd", nullable = false)
  private long priceVnd;

  @Column(name = "is_active", nullable = false)
  private boolean isActive = true;

  @Column(name = "name", length = 255)
  private String name = "";

  @Column(name = "description", columnDefinition = "TEXT")
  private String description;

  @Column(name = "billing_cycle", length = 50)
  private String billingCycle = "ONE_TIME";

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "features", columnDefinition = "jsonb")
  private JsonNode features;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "feature_options", columnDefinition = "jsonb")
  private JsonNode featureOptions;

  @Column(name = "highlighted")
  private boolean highlighted = false;

  @Column(name = "partner_id")
  private UUID partnerId;

  @PrePersist
  void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
