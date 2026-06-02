package com.example.app.dto.request;

import java.util.Map;

public record LegacyPdfPreviewRequest(
    Map<String, Object> pdfTemplateConfig,
    String templateType
) {
}
