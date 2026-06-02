package com.example.app.repositories;

import com.example.app.models.Insight;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InsightRepository extends JpaRepository<Insight, UUID> {

  @Query("""
      SELECT i FROM Insight i
      WHERE (:testCode IS NULL OR UPPER(i.testCode) = :testCode)
        AND (:dimension IS NULL OR LOWER(i.dimension) = :dimension)
        AND (:category IS NULL OR LOWER(i.category) = :category)
      ORDER BY i.testCode ASC, i.category ASC, i.dimension ASC, i.createdAt DESC
      """)
  List<Insight> search(@Param("testCode") String testCode, @Param("dimension") String dimension,
      @Param("category") String category);
}
