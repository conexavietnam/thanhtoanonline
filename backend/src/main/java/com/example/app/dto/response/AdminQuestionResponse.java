package com.example.app.dto.response;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AdminQuestionResponse(
    UUID id,
    String testCode,
    UUID categoryId,
    String content,
    String traitKey,
    boolean reverseScored,
    BigDecimal weight,
    int orderIndex,
    List<QuestionOptionResponse> options
) {

  public record QuestionOptionResponse(
      UUID id,
      String label,
      int value,
      String discDimension,
      String traitOverride,
      int orderIndex
  ) {
  }
}
