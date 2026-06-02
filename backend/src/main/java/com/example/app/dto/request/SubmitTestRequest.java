package com.example.app.dto.request;

import jakarta.validation.Valid;
import java.util.List;

public record SubmitTestRequest(
    @Valid List<AnswerItemRequest> answers
) {
}
