package com.example.app.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ExportPdfRequest(
    @NotNull UUID sessionId
) {
}
