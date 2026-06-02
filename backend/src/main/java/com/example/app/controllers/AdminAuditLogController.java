package com.example.app.controllers;

import com.example.app.dto.response.AuditLogResponse;
import com.example.app.models.AuditActionType;
import com.example.app.services.AdminAuditLogService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditLogController {

  private final AdminAuditLogService adminAuditLogService;

  @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
  public Page<AuditLogResponse> getAll(@PageableDefault(size = 50) Pageable pageable) {
    return adminAuditLogService.getAll(pageable);
  }

  @GetMapping(value = "/user/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
  public Page<AuditLogResponse> getByUser(
      @PathVariable UUID userId,
      @PageableDefault(size = 50) Pageable pageable) {
    return adminAuditLogService.getByUser(userId, pageable);
  }

  @GetMapping(value = "/action-type", produces = MediaType.APPLICATION_JSON_VALUE)
  public Page<AuditLogResponse> getByActionType(
      @RequestParam("actionType") AuditActionType actionType,
      @PageableDefault(size = 50) Pageable pageable) {
    return adminAuditLogService.getByActionType(actionType, pageable);
  }

  @GetMapping(value = "/entity-type", produces = MediaType.APPLICATION_JSON_VALUE)
  public Page<AuditLogResponse> getByEntityType(
      @RequestParam("entityType") String entityType,
      @PageableDefault(size = 50) Pageable pageable) {
    return adminAuditLogService.getByEntityType(entityType, pageable);
  }

  @GetMapping(value = "/date-range", produces = MediaType.APPLICATION_JSON_VALUE)
  public Page<AuditLogResponse> getByDateRange(
      @RequestParam("startDate") String startDate,
      @RequestParam("endDate") String endDate,
      @PageableDefault(size = 50) Pageable pageable) {
    return adminAuditLogService.getByDateRange(startDate, endDate, pageable);
  }

  @GetMapping(value = "/user/{userId}/date-range", produces = MediaType.APPLICATION_JSON_VALUE)
  public Page<AuditLogResponse> getByUserAndDateRange(
      @PathVariable UUID userId,
      @RequestParam("startDate") String startDate,
      @RequestParam("endDate") String endDate,
      @PageableDefault(size = 50) Pageable pageable) {
    return adminAuditLogService.getByUserAndDateRange(userId, startDate, endDate, pageable);
  }
}
