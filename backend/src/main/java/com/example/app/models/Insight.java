package com.example.app.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "insights")
@Getter
@Setter
@NoArgsConstructor
public class Insight {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "test_code", nullable = false, length = 50)
  private String testCode = "DISC";

  @Column(nullable = false, length = 100)
  private String category = "general";

  @Column(nullable = false, length = 50)
  private String dimension;

  @Column(columnDefinition = "TEXT")
  private String summary;

  @Column(name = "key_behaviors", columnDefinition = "TEXT")
  private String keyBehaviors;

  @Column(columnDefinition = "TEXT")
  private String strengths;

  @Column(columnDefinition = "TEXT")
  private String weaknesses;

  @Column(name = "communication_style", columnDefinition = "TEXT")
  private String communicationStyle;

  @Column(name = "leadership_style", columnDefinition = "TEXT")
  private String leadershipStyle;

  @Column(nullable = false)
  private boolean active = true;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "allowed_plan_codes", columnDefinition = "jsonb")
  private List<String> allowedPlanCodes = new ArrayList<>();

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    if (createdAt == null)
      createdAt = now;
    if (updatedAt == null)
      updatedAt = now;
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }
}
