package com.example.app.dto.response;

import java.math.BigDecimal;

public record AffiliateSummaryResponse(
    String referralCode,
    String referralLink,
    long referredCount,
    long totalEarningVnd,
    long totalPaidOrders,
    BigDecimal currentPercent
) {
}
