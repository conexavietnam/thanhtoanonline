package com.example.app.dto.response;

import java.util.List;
import java.util.UUID;

public record TestQuestionSetResponse(
    UUID sessionId,
    String testCode,
    String mode,
    long totalQuestions,
    List<QuestionItemResponse> questions
) {
}
