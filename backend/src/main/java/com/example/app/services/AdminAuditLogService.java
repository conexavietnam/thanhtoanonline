package com.example.app.services;

import com.example.app.dto.response.AuditLogResponse;
import com.example.app.models.AppUser;
import com.example.app.models.AuditActionType;
import com.example.app.models.AuditLog;
import com.example.app.repositories.AuditLogRepository;
import com.example.app.utils.ApiException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminAuditLogService {

  private final AuditLogRepository auditLogRepository;

  public Page<AuditLogResponse> getAll(Pageable pageable) {
    return auditLogRepository.findAllBy(sorted(pageable)).map(this::toResponse);
  }

  public Page<AuditLogResponse> getByUser(UUID userId, Pageable pageable) {
    return auditLogRepository.findByUserId(userId, sorted(pageable)).map(this::toResponse);
  }

  public Page<AuditLogResponse> getByActionType(AuditActionType actionType, Pageable pageable) {
    return auditLogRepository.findByActionType(actionType, sorted(pageable)).map(this::toResponse);
  }

  public Page<AuditLogResponse> getByEntityType(String entityType, Pageable pageable) {
    return auditLogRepository.findByEntityTypeIgnoreCase(entityType, sorted(pageable)).map(this::toResponse);
  }

  public Page<AuditLogResponse> getByDateRange(String startDate, String endDate, Pageable pageable) {
    Instant start = parseDate(startDate, false);
    Instant end = parseDate(endDate, true);
    return auditLogRepository.findByCreatedAtBetween(start, end, sorted(pageable)).map(this::toResponse);
  }

  public Page<AuditLogResponse> getByUserAndDateRange(UUID userId, String startDate, String endDate, Pageable pageable) {
    Instant start = parseDate(startDate, false);
    Instant end = parseDate(endDate, true);
    return auditLogRepository.findByUserIdAndCreatedAtBetween(userId, start, end, sorted(pageable)).map(this::toResponse);
  }

  public Page<AuditLogResponse> export(UUID userId,
      AuditActionType actionType,
      String entityType,
      String startDate,
      String endDate,
      Pageable pageable) {

    if (userId != null && startDate != null && endDate != null) {
      return getByUserAndDateRange(userId, startDate, endDate, pageable);
    }
    if (startDate != null && endDate != null) {
      return getByDateRange(startDate, endDate, pageable);
    }
    if (userId != null) {
      return getByUser(userId, pageable);
    }
    if (actionType != null) {
      return getByActionType(actionType, pageable);
    }
    if (entityType != null && !entityType.isBlank()) {
      return getByEntityType(entityType, pageable);
    }
    return getAll(pageable);
  }

  public void log(AuditActionType actionType,
      String entityType,
      String entityId,
      String description,
      String ipAddress,
      AppUser user) {
    AuditLog log = new AuditLog();
    log.setActionType(actionType == null ? AuditActionType.OTHER : actionType);
    log.setEntityType(entityType);
    log.setEntityId(entityId);
    log.setDescription(description);
    log.setIpAddress(ipAddress);

    if (user != null) {
      log.setUser(user);
      log.setUserEmail(user.getEmail());
      log.setUserName(user.getFullName());
    }

    auditLogRepository.save(log);
  }

  private Pageable sorted(Pageable pageable) {
    if (pageable.getSort().isSorted()) {
      return pageable;
    }
    return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
  }

  private Instant parseDate(String value, boolean endOfRange) {
    if (value == null || value.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DATE", "startDate and endDate are required");
    }
    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm[:ss[.SSS]]");
    try {
      LocalDateTime ldt = LocalDateTime.parse(value, formatter);
      // Treat provided local datetime as UTC to avoid timezone surprises.
      return ldt.atZone(ZoneId.of("UTC")).toInstant();
    } catch (DateTimeParseException e) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DATE", "Invalid date format, expected yyyy-MM-dd'T'HH:mm[:ss]");
    }
  }

  private AuditLogResponse toResponse(AuditLog log) {
    UUID userId = log.getUser() != null ? log.getUser().getId() : null;
    return new AuditLogResponse(
        log.getId(),
        log.getCreatedAt(),
        userId,
        log.getUserEmail(),
        log.getUserName(),
        log.getActionType(),
        log.getEntityType(),
        log.getEntityId(),
        log.getDescription(),
        log.getIpAddress()
    );
  }
}
