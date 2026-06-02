package com.example.app.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import jakarta.validation.Valid;

public record UpdateQuestionRequest(
    @NotBlank @Size(max = 50) String testCode,
    UUID categoryId,
    @NotBlank String content,
    @NotBlank @Size(max = 50) String traitKey,
    boolean reverseScored,
    @NotNull @DecimalMin("0.0001") BigDecimal weight,
    @NotNull Integer orderIndex,
    @Valid List<QuestionOptionRequest> options
) {

  public record QuestionOptionRequest(
      @NotBlank String label,
      @NotNull @Min(1) @Max(5) Integer value,
      String discDimension,
      String traitOverride,
      @NotNull @Min(0) Integer orderIndex
  ) {
  }
}
