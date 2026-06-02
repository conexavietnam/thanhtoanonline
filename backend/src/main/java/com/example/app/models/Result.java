package com.example.app.models;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "results")
@Getter
@Setter
@NoArgsConstructor
public class Result {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "session_id", nullable = false, unique = true)
  private TestSession session;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "result_json", nullable = false, columnDefinition = "jsonb")
  private JsonNode resultJson;

  @Column(columnDefinition = "TEXT")
  private String summary;

  @PrePersist
  void onCreate() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
  }
}
