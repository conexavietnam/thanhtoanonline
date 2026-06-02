package com.example.app.controllers;

import com.example.app.dto.response.AuditLogResponse;
import com.example.app.dto.response.PaymentResponse;
import com.example.app.dto.response.ReferralResponse;
import com.example.app.dto.response.AdminUserSummaryResponse;
import com.example.app.models.AuditActionType;
import com.example.app.models.OrderStatus;
import com.example.app.models.ReferralStatus;
import com.example.app.services.AdminAuditLogService;
import com.example.app.services.AdminPaymentService;
import com.example.app.services.AdminReferralService;
import com.example.app.services.AdminUserService;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/exports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminExportController {

  private final AdminPaymentService adminPaymentService;
  private final AdminReferralService adminReferralService;
  private final AdminAuditLogService adminAuditLogService;
  private final AdminUserService adminUserService;

  @GetMapping("/users")
  public ResponseEntity<byte[]> exportUsers(
      @RequestParam(value = "role", required = false) String role,
      @RequestParam(value = "status", required = false) String status,
      @RequestParam(value = "keyword", required = false) String keyword,
      // Frontend currently sends `search`, so keep it as an alias
      @RequestParam(value = "search", required = false) String search) {

    String keywordValue = (keyword != null && !keyword.isBlank()) ? keyword : search;
    List<AdminUserSummaryResponse> users = adminUserService.listUsers(role, status, keywordValue);

    StringBuilder csv = new StringBuilder();
    csv.append("id,email,fullName,role,status,credits,referredCount,referralCode,referredByCode,joinedAt\n");
    for (AdminUserSummaryResponse u : users) {
      csv.append(u.id()).append(',')
          .append(escape(u.email())).append(',')
          .append(escape(u.fullName())).append(',')
          .append(u.role()).append(',')
          .append(u.status()).append(',')
          .append(u.credits()).append(',')
          .append(u.referredCount()).append(',')
          .append(escape(u.referralCode())).append(',')
          .append(escape(u.referredByCode())).append(',')
          .append(u.joinedAt())
          .append('\n');
    }

    byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"users.csv\"")
        .contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
        .contentLength(bytes.length)
        .body(bytes);
  }

  @GetMapping("/payments")
  public ResponseEntity<byte[]> exportPayments(@RequestParam(value = "status", required = false) OrderStatus status) {
    List<PaymentResponse> payments = adminPaymentService.list(status);
    StringBuilder csv = new StringBuilder();
    csv.append("id,paymentReference,provider,amount,currency,status,createdAt,completedAt,planName,userEmail,userFullName,note\n");
    for (PaymentResponse p : payments) {
      csv.append(p.id()).append(',')
          .append(escape(p.paymentReference())).append(',')
          .append(p.provider()).append(',')
          .append(p.amount()).append(',')
          .append(p.currency()).append(',')
          .append(p.status()).append(',')
          .append(p.createdAt()).append(',')
          .append(p.completedAt() == null ? "" : p.completedAt()).append(',')
          .append(escape(p.planName())).append(',')
          .append(escape(p.userEmail())).append(',')
          .append(escape(p.userFullName())).append(',')
          .append(escape(p.note()))
          .append('\n');
    }
    byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"payments.csv\"")
        .contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
        .contentLength(bytes.length)
        .body(bytes);
  }

  @GetMapping("/referrals")
  public ResponseEntity<byte[]> exportReferrals(@RequestParam(value = "status", required = false) ReferralStatus status) {
    List<ReferralResponse> referrals = adminReferralService.list(status);
    StringBuilder csv = new StringBuilder();
    csv.append("id,referrerEmail,referrerFullName,referredUserEmail,referredUserFullName,referralCode,status,commissionPercentage,commissionAmount,paidAt\n");
    for (ReferralResponse r : referrals) {
      csv.append(r.id()).append(',')
          .append(escape(r.referrerEmail())).append(',')
          .append(escape(r.referrerFullName())).append(',')
          .append(escape(r.referredUserEmail())).append(',')
          .append(escape(r.referredUserFullName())).append(',')
          .append(escape(r.referralCode())).append(',')
          .append(r.status()).append(',')
          .append(r.commissionPercentage() == null ? "" : r.commissionPercentage()).append(',')
          .append(r.commissionAmount() == null ? "" : r.commissionAmount()).append(',')
          .append(r.paidAt() == null ? "" : r.paidAt())
          .append('\n');
    }
    byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"referrals.csv\"")
        .contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
        .contentLength(bytes.length)
        .body(bytes);
  }

  @GetMapping("/audit-logs")
  public ResponseEntity<byte[]> exportAuditLogs(
      @RequestParam(value = "userId", required = false) UUID userId,
      @RequestParam(value = "actionType", required = false) AuditActionType actionType,
      @RequestParam(value = "entityType", required = false) String entityType,
      @RequestParam(value = "startDate", required = false) String startDate,
      @RequestParam(value = "endDate", required = false) String endDate,
      @RequestParam(value = "page", defaultValue = "0") int page,
      @RequestParam(value = "size", defaultValue = "1000") int size) {

    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    Page<AuditLogResponse> logs = adminAuditLogService.export(userId, actionType, entityType, startDate, endDate, pageable);

    StringBuilder csv = new StringBuilder();
    csv.append("id,createdAt,userId,userEmail,userName,actionType,entityType,entityId,description,ipAddress\n");
    for (AuditLogResponse log : logs) {
      csv.append(log.id()).append(',')
          .append(log.createdAt()).append(',')
          .append(log.userId() == null ? "" : log.userId()).append(',')
          .append(escape(log.userEmail())).append(',')
          .append(escape(log.userName())).append(',')
          .append(log.actionType()).append(',')
          .append(escape(log.entityType())).append(',')
          .append(escape(log.entityId())).append(',')
          .append(escape(log.description())).append(',')
          .append(escape(log.ipAddress()))
          .append('\n');
    }

    byte[] bytes = csv.toString().getBytes(StandardCharsets.UTF_8);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit-logs.csv\"")
        .contentType(MediaType.parseMediaType("text/csv; charset=utf-8"))
        .contentLength(bytes.length)
        .body(bytes);
  }

  private String escape(String value) {
    if (value == null) return "";
    if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
  }
}
