package com.example.app.repositories;

import com.example.app.models.Answer;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerRepository extends JpaRepository<Answer, UUID> {
  List<Answer> findBySessionId(UUID sessionId);

  long countBySessionId(UUID sessionId);

  Optional<Answer> findBySessionIdAndQuestionId(UUID sessionId, UUID questionId);
}
