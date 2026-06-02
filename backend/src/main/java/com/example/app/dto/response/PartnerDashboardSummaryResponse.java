package com.example.app.dto.response;

public record PartnerDashboardSummaryResponse(
    int pdfCredits,
    long totalTests,
    long totalPdfExports,
    long totalRevenueVnd,
    long totalCostVnd
) {
}
