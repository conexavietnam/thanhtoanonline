package com.example.app.repositories;

import com.example.app.models.DevelopmentPlan;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DevelopmentPlanRepository extends JpaRepository<DevelopmentPlan, UUID> {

  @Query("""
      SELECT d FROM DevelopmentPlan d
      WHERE (:testCode IS NULL OR UPPER(d.testCode) = :testCode)
        AND (:dimension IS NULL OR LOWER(d.dimension) = :dimension)
      ORDER BY d.testCode ASC, d.dimension ASC, d.createdAt DESC
      """)
  List<DevelopmentPlan> search(@Param("testCode") String testCode, @Param("dimension") String dimension);
}
