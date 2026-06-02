package com.example.app.models;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "question_options")
@Getter
@Setter
@NoArgsConstructor
public class QuestionOption {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
  @JoinColumn(name = "question_id", nullable = false)
  @JsonIgnore
  private Question question;

  @Column(nullable = false)
  private String label;

  @Column(name = "value", nullable = false)
  private int value;

  @Column(name = "disc_dimension", length = 1)
  private String discDimension; // D / I / S / C for DISC tests

  @Column(name = "trait_override", length = 50)
  private String traitOverride; // Optional explicit trait key (e.g., BIG5_O, IKIGAI_NEED)

  @Column(name = "order_index", nullable = false)
  private int orderIndex;
}
