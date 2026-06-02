package com.example.app.repositories;

import com.example.app.models.QuestionOption;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionOptionRepository extends JpaRepository<QuestionOption, UUID> {
  void deleteByQuestionId(UUID questionId);
}
