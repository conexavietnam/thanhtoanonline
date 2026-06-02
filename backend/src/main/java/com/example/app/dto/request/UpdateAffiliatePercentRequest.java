package com.example.app.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record UpdateAffiliatePercentRequest(
    @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal percent
) {
}
