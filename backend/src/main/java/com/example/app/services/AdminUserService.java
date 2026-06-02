package com.example.app.services;

import com.example.app.dto.request.AdjustCreditRequest;
import com.example.app.dto.request.AdminUpdateUserRequest;
import com.example.app.dto.request.ChangeUserRoleRequest;
import com.example.app.dto.request.ToggleUserStatusRequest;
import com.example.app.dto.response.AdminUserDetailResponse;
import com.example.app.dto.response.AdminUserSummaryResponse;
import com.example.app.models.AppUser;
import com.example.app.models.CreditTransaction;
import com.example.app.models.CreditTxType;
import com.example.app.dto.request.AdminCreateUserRequest;
import com.example.app.models.AuthProvider;
import com.example.app.models.UserRole;
import com.example.app.models.UserStatus;
import com.example.app.repositories.AppUserRepository;
import com.example.app.repositories.CreditTransactionRepository;
import com.example.app.utils.ApiException;
import com.example.app.utils.EmailAddressPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserService {
  private final AppUserRepository appUserRepository;
  private final CreditTransactionRepository creditTransactionRepository;
  private final PasswordEncoder passwordEncoder;

  public List<AdminUserSummaryResponse> listUsers(String role, String status, String keyword) {
    return appUserRepository.findAll().stream()
        .filter(this::shouldAppearInAdminList)
        .filter(user -> role == null || role.isBlank() || user.getRole().name().equalsIgnoreCase(role.trim()))
        .filter(user -> status == null || status.isBlank() || user.getStatus().name().equalsIgnoreCase(status.trim()))
        .filter(user -> keyword == null || keyword.isBlank() ||
            user.getEmail().toLowerCase(Locale.ROOT).contains(keyword.toLowerCase(Locale.ROOT).trim()) ||
            user.getFullName().toLowerCase(Locale.ROOT).contains(keyword.toLowerCase(Locale.ROOT).trim()))
        .map(this::toUserSummary)
        .toList();
  }

  @Transactional
  public AdminUserSummaryResponse createUser(AdminCreateUserRequest request) {
    String normalizedEmail = normalizeEmail(request.getEmail());
    EmailAddressPolicy.assertAllowedForHumanAccount(normalizedEmail);
    if (appUserRepository.existsByEmailIgnoreCase(normalizedEmail)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "EMAIL_EXISTS", "Email đã tồn tại");
    }

    AppUser user = new AppUser();
    user.setEmail(normalizedEmail);
    user.setFullName(request.getFullName().trim());
    user.setAuthProvider(AuthProvider.EMAIL);
    user.setEmailVerified(true);

    if (request.getPassword() != null && !request.getPassword().isBlank()) {
      user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    }

    if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
      user.setPhoneNumber(request.getPhoneNumber().trim());
    }

    if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
      user.setAvatarUrl(request.getAvatarUrl().trim());
    }

    UserRole requestedRole = extractRequestedRole(request.getRoles());
    user.setRole(requestedRole != null ? requestedRole : UserRole.USER);

    if (request.getStatus() != null && !request.getStatus().isBlank()) {
      try {
        user.setStatus(UserStatus.valueOf(request.getStatus().trim().toUpperCase()));
      } catch (IllegalArgumentException e) {
        user.setStatus(UserStatus.ACTIVE);
      }
    } else {
      user.setStatus(UserStatus.ACTIVE);
    }

    return toUserSummary(appUserRepository.save(user));
  }

  public AdminUserDetailResponse getUserDetail(UUID userId) {
    AppUser user = appUserRepository.findById(userId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Người dùng không tồn tại"));

    long referredCount = user.getReferralCode() == null ? 0
        : appUserRepository.countByReferredByCode(user.getReferralCode());

    return new AdminUserDetailResponse(
        user.getId(),
        user.getEmail(),
        user.getFullName(),
        user.getRole().name(),
        user.getStatus().name(),
        user.getPdfCredits(),
        referredCount,
        user.getReferralCode(),
        user.getReferredByCode(),
        user.getCreatedAt(),
        user.getPhoneNumber(),
        user.getAddress());
  }

  @Transactional
  public AdminUserSummaryResponse updateUser(UUID userId, AdminUpdateUserRequest request) {
    AppUser user = appUserRepository.findById(userId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Người dùng không tồn tại"));

    if (request.getEmail() != null && !request.getEmail().isBlank()
        && !user.getEmail().equalsIgnoreCase(request.getEmail().trim())) {
      String normalizedEmail = normalizeEmail(request.getEmail());
      EmailAddressPolicy.assertAllowedForHumanAccount(normalizedEmail);
      if (appUserRepository.existsByEmailIgnoreCase(normalizedEmail)) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "EMAIL_EXISTS", "Email đã tồn tại");
      }
      user.setEmail(normalizedEmail);
    }

    if (request.getFullName() != null && !request.getFullName().isBlank()) {
      user.setFullName(request.getFullName().trim());
    }

    if (request.getPhoneNumber() != null) {
      user.setPhoneNumber(request.getPhoneNumber().trim());
    }

    if (request.getAvatarUrl() != null) {
      user.setAvatarUrl(request.getAvatarUrl().trim());
    }

    if (request.getStatus() != null && !request.getStatus().isBlank()) {
      try {
        user.setStatus(UserStatus.valueOf(request.getStatus().trim().toUpperCase()));
      } catch (IllegalArgumentException e) {
        // ignore
      }
    }

    if (request.getPdfExportCredits() != null) {
      user.setPdfCredits(request.getPdfExportCredits());
    }

    return toUserSummary(appUserRepository.save(user));
  }

  @Transactional
  public AdminUserSummaryResponse changeRole(UUID userId, ChangeUserRoleRequest request) {
    AppUser user = appUserRepository.findById(userId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Người dùng không tồn tại"));

    UserRole requestedRole = extractRequestedRole(request.roles());
    if (requestedRole != null) {
      user.setRole(requestedRole);
    }
    return toUserSummary(appUserRepository.save(user));
  }

  @Transactional
  public AdminUserSummaryResponse toggleStatus(UUID userId, ToggleUserStatusRequest request) {
    AppUser user = appUserRepository.findById(userId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Người dùng không tồn tại"));

    if (Boolean.TRUE.equals(request.suspended())) {
      user.setStatus(UserStatus.SUSPENDED);
    } else {
      if (user.isEmailVerified()) {
        user.setStatus(UserStatus.ACTIVE);
      } else {
        user.setStatus(UserStatus.PENDING_VERIFICATION);
      }
    }

    return toUserSummary(appUserRepository.save(user));
  }

  @Transactional
  public AdminUserSummaryResponse adjustCredit(UUID userId, AdjustCreditRequest request, String adminEmail) {
    AppUser user = appUserRepository.findById(userId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Người dùng không tồn tại"));

    int newValue = user.getPdfCredits() + request.delta();
    if (newValue < 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "INSUFFICIENT_CREDIT", "Credit không hợp lệ");
    }

    user.setPdfCredits(newValue);
    appUserRepository.save(user);

    CreditTransaction tx = new CreditTransaction();
    tx.setUser(user);
    tx.setType(CreditTxType.ADMIN_ADJUST);
    tx.setDelta(request.delta());
    tx.setCreditsAfter(newValue);
    tx.setRefType("ADMIN");
    tx.setNote("Adjusted by " + adminEmail + (request.note() == null ? "" : (": " + request.note())));
    creditTransactionRepository.save(tx);

    return toUserSummary(user);
  }

  @Transactional
  public void deleteUser(UUID userId) {
    AppUser user = appUserRepository.findById(userId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Người dùng không tồn tại"));

    appUserRepository.delete(user);
  }

  private AdminUserSummaryResponse toUserSummary(AppUser user) {
    long referredCount = user.getReferralCode() == null ? 0
        : appUserRepository.countByReferredByCode(user.getReferralCode());
    return new AdminUserSummaryResponse(
        user.getId(),
        user.getEmail(),
        user.getFullName(),
        user.getRole().name(),
        user.getStatus().name(),
        user.getPdfCredits(),
        referredCount,
        user.getReferralCode(),
        user.getReferredByCode(),
        user.getCreatedAt());
  }

  private boolean shouldAppearInAdminList(AppUser user) {
    if (!EmailAddressPolicy.isReservedDomain(user.getEmail())) {
      return true;
    }

    // Quốc Trí: account placeholder chưa verify từ luồng public/register chỉ làm bẩn admin list, nên ẩn khỏi /admin/users.
    return user.isEmailVerified() || user.getStatus() != UserStatus.PENDING_VERIFICATION;
  }

  private String normalizeEmail(String email) {
    return email.trim().toLowerCase(Locale.ROOT);
  }

  private UserRole extractRequestedRole(List<String> roles) {
    if (roles == null || roles.isEmpty()) {
      return null;
    }

    // Quốc Trí: backend chỉ lưu 1 role chính, nên nếu UI gửi nhiều checkbox thì chọn theo mức ưu tiên cao nhất.
    List<UserRole> normalizedRoles = roles.stream()
        .filter(role -> role != null && !role.isBlank())
        .map(role -> role.trim().toUpperCase(Locale.ROOT))
        .map(role -> {
          try {
            return UserRole.valueOf(role);
          } catch (IllegalArgumentException e) {
            return null;
          }
        })
        .filter(role -> role != null)
        .toList();

    if (normalizedRoles.contains(UserRole.SUPER_ADMIN)) {
      return UserRole.SUPER_ADMIN;
    }
    if (normalizedRoles.contains(UserRole.ADMIN)) {
      return UserRole.ADMIN;
    }
    if (normalizedRoles.contains(UserRole.PARTNER)) {
      return UserRole.PARTNER;
    }
    if (normalizedRoles.contains(UserRole.USER)) {
      return UserRole.USER;
    }
    return null;
  }
}
