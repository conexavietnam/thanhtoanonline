package com.example.app.dto.response;

import com.example.app.models.AuditActionType;
import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
    UUID id,
    Instant createdAt,
    UUID userId,
    String userEmail,
    String userName,
    AuditActionType actionType,
    String entityType,
    String entityId,
    String description,
    String ipAddress
) {
}
