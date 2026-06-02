package com.example.app.dto.request;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

/**
 * Payload for the public DISC test submission flow (used by the frontend /disc/tests route).
 */
public record DiscTestSubmitRequest(
    @NotEmpty(message = "answers is required") List<AnswerItem> answers,
    String category,
    String testTakerName,
    String testMode
) {
  public record AnswerItem(
      UUID questionId,
      UUID optionId
  ) {
  }
}
