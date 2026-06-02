package com.example.app.dto.response;

public record AdminOverviewResponse(
    long totalUsers,
    long totalPartners,
    long totalTests,
    long totalExports,
    long totalRevenueVnd,
    long totalCostVnd,
    long totalAffiliateVnd
) {
}
