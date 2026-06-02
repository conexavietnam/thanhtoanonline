package com.example.app.repositories;

import com.example.app.models.Career;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CareerRepository extends JpaRepository<Career, UUID> {

  @Query("""
      SELECT c FROM Career c
      WHERE (:testCode IS NULL OR UPPER(c.testCode) = :testCode)
        AND (:dimension IS NULL OR LOWER(c.primaryDimension) = :dimension)
      ORDER BY c.testCode ASC, c.primaryDimension ASC, c.matchLevel DESC, c.jobTitle ASC
      """)
  List<Career> search(@Param("testCode") String testCode, @Param("dimension") String dimension);
}
