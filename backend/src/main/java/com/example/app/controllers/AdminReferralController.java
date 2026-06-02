package com.example.app.controllers;

import com.example.app.dto.request.UpdateReferralCommissionRequest;
import com.example.app.dto.request.UpdateReferralStatusRequest;
import com.example.app.dto.response.ReferralResponse;
import com.example.app.dto.response.ReferralStatsResponse;
import com.example.app.models.ReferralStatus;
import com.example.app.services.AdminReferralService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/referrals")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReferralController {

  private final AdminReferralService adminReferralService;

  @GetMapping
  public List<ReferralResponse> list(@RequestParam(value = "status", required = false) ReferralStatus status) {
    return adminReferralService.list(status);
  }

  @GetMapping("/stats")
  public ReferralStatsResponse stats() {
    return adminReferralService.stats();
  }

  @GetMapping("/{id}")
  public ReferralResponse get(@PathVariable UUID id) {
    return adminReferralService.get(id);
  }

  @PutMapping("/{id}/status")
  public ReferralResponse updateStatus(@PathVariable UUID id, @Valid @RequestBody UpdateReferralStatusRequest request) {
    return adminReferralService.updateStatus(id, request);
  }

  @PutMapping("/{id}/commission")
  public ReferralResponse updateCommission(@PathVariable UUID id, @Valid @RequestBody UpdateReferralCommissionRequest request) {
    return adminReferralService.updateCommission(id, request);
  }

  @PostMapping("/{id}/payout")
  public ReferralResponse markAsPaid(@PathVariable UUID id) {
    return adminReferralService.markAsPaid(id);
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable UUID id) {
    // Optional delete if needed
  }
}
