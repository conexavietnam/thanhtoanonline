package com.example.app.dto.response;

import java.util.List;
import java.util.UUID;

public record PublicPlanResponse(
    UUID id,
    String code,
    String name,
    String description,
    long price,
    String currency,
    String billingCycle,
    List<String> features,
    boolean highlighted,
    int pdfExportLimit
) {
}
