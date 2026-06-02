package com.example.app.dto.response;

import java.util.List;
import java.util.UUID;

public record QuestionItemResponse(
    UUID id,
    UUID categoryId,
    String content,
    String traitKey,
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
