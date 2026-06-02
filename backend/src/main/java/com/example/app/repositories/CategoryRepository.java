package com.example.app.repositories;

import com.example.app.models.Category;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
  List<Category> findByTestCodeOrderByNameAsc(String testCode);

  List<Category> findByTestCodeInOrderByTestCodeAscNameAsc(List<String> testCodes);

  long countByTestCode(String testCode);
}
