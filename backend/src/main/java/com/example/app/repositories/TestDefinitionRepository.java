package com.example.app.repositories;

import com.example.app.models.TestDefinition;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TestDefinitionRepository extends JpaRepository<TestDefinition, UUID> {
  Optional<TestDefinition> findByCode(String code);

  List<TestDefinition> findByIsActiveTrueOrderByCodeAsc();
}
