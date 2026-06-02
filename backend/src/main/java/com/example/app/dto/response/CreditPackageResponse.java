package com.example.app.dto.response;

import java.util.List;
import java.util.UUID;
import lombok.Builder;

@Builder
public record CreditPackageResponse(
        UUID id,
        String planType,
        String code,
        String name,
        long price,
        String currency,
        String billingCycle,
        String description,
        List<String> features,
        List<String> featureOptions,
        boolean active,
        boolean highlighted,
        Integer pdfExportLimit,
        UUID partnerId,
        String partnerName) {
}
