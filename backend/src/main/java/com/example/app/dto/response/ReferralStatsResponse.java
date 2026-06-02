package com.example.app.dto.response;

public record ReferralStatsResponse(
    long totalReferrals,
    long pendingCount,
    long qualifiedCount,
    long paidCount,
    long cancelledCount,
    long totalPendingCommission,
    long totalPaidCommission
) {
}
