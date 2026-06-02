package com.example.app.repositories;

import com.example.app.models.Question;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface QuestionRepository extends JpaRepository<Question, UUID> {

  /**
   * Fetches questions for a given test code, eagerly loading the category in the
   * same query to avoid N+1 lazy loading issues.
   */
  @Query("SELECT DISTINCT q FROM Question q LEFT JOIN FETCH q.category LEFT JOIN FETCH q.options WHERE q.testCode = :testCode ORDER BY q.orderIndex ASC, q.createdAt ASC")
  List<Question> findByTestCodeOrderByOrderIndexAscCreatedAtAsc(@Param("testCode") String testCode);

  @Query("SELECT DISTINCT q FROM Question q LEFT JOIN FETCH q.category LEFT JOIN FETCH q.options WHERE q.testCode = :testCode AND q.category.id = :categoryId ORDER BY q.orderIndex ASC, q.createdAt ASC")
  List<Question> findByTestCodeAndCategoryIdOrderByOrderIndexAscCreatedAtAsc(@Param("testCode") String testCode,
      @Param("categoryId") UUID categoryId);

  @Query("SELECT DISTINCT q FROM Question q LEFT JOIN FETCH q.category LEFT JOIN FETCH q.options ORDER BY q.orderIndex ASC, q.createdAt ASC")
  List<Question> findAllWithOptions();

  long countByTestCode(String testCode);
}
