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
@Table(name = "careers")
@Getter
@Setter
@NoArgsConstructor
public class Career {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "test_code", nullable = false, length = 50)
  private String testCode = "DISC";

  @Column(name = "primary_dimension", nullable = false, length = 50)
  private String primaryDimension;

  @Column(name = "secondary_dimension", length = 50)
  private String secondaryDimension;

  @Column(name = "job_title", nullable = false)
  private String jobTitle;

  @Column(name = "match_level", nullable = false)
  private int matchLevel;

  @Column(columnDefinition = "TEXT")
  private String summary;

  @Column(columnDefinition = "TEXT")
  private String skills;

  @Column(name = "learning_resources", columnDefinition = "TEXT")
  private String learningResources;

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
