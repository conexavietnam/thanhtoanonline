package com.example.app.controllers;

import com.example.app.dto.request.AdjustCreditRequest;
import com.example.app.dto.request.AdminCreateUserRequest;
import com.example.app.dto.request.AdminUpdateUserRequest;
import com.example.app.dto.request.ChangeUserRoleRequest;
import com.example.app.dto.request.ToggleUserStatusRequest;
import com.example.app.dto.response.AdminUserDetailResponse;
import com.example.app.dto.response.AdminUserSummaryResponse;
import com.example.app.services.AdminUserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
  private final AdminUserService adminUserService;

  @GetMapping
  public List<AdminUserSummaryResponse> users(
      @RequestParam(value = "role", required = false) String role,
      @RequestParam(value = "status", required = false) String status,
      @RequestParam(value = "keyword", required = false) String keyword) {
    return adminUserService.listUsers(role, status, keyword);
  }

  @PostMapping
  public AdminUserSummaryResponse createUser(@Valid @RequestBody AdminCreateUserRequest request) {
    return adminUserService.createUser(request);
  }

  @GetMapping("/{userId}")
  public AdminUserDetailResponse detail(@PathVariable UUID userId) {
    return adminUserService.getUserDetail(userId);
  }

  @PutMapping("/{userId}")
  public AdminUserSummaryResponse updateUser(@PathVariable UUID userId,
      @Valid @RequestBody AdminUpdateUserRequest request) {
    return adminUserService.updateUser(userId, request);
  }

  @PutMapping("/{userId}/roles")
  public AdminUserSummaryResponse changeRole(@PathVariable UUID userId,
      @Valid @RequestBody ChangeUserRoleRequest request) {
    return adminUserService.changeRole(userId, request);
  }

  @PutMapping("/{userId}/status")
  public AdminUserSummaryResponse toggleStatus(@PathVariable UUID userId,
      @Valid @RequestBody ToggleUserStatusRequest request) {
    return adminUserService.toggleStatus(userId, request);
  }

  // Quốc Trí: mở DELETE endpoint cho admin user management để frontend không bị 405.
  @DeleteMapping("/{userId}")
  public void deleteUser(@PathVariable UUID userId) {
    adminUserService.deleteUser(userId);
  }

  @PostMapping("/{userId}/credits/adjust")
  public AdminUserSummaryResponse adjustCredit(
      Authentication authentication,
      @PathVariable UUID userId,
      @Valid @RequestBody AdjustCreditRequest request) {
    return adminUserService.adjustCredit(userId, request, authentication.getName());
  }
}
