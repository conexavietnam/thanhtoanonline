package com.example.app.dto.response;

public record PublicSettingsResponse(
    String siteName,
    String siteDescription,
    String contactEmail,
    String contactPhone,
    String bankId,
    String bankName,
    String accountNumber,
    String accountName,
    boolean maintenanceMode
) {
}
