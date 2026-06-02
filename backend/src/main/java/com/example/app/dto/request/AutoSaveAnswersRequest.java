package com.example.app.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AutoSaveAnswersRequest(
    @Valid @NotEmpty List<AnswerItemRequest> answers
) {
}
