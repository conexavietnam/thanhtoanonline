package com.example.app.services;

import com.example.app.controllers.UserProfileController.UpdateProfileRequest;
import com.example.app.dto.response.UserMeResponse;
import com.example.app.dto.response.UserMeResponse.ActiveSubscription;
import com.example.app.models.AppUser;
import com.example.app.models.Order;
import com.example.app.models.OrderStatus;
import com.example.app.models.UserRole;
import com.example.app.repositories.AppUserRepository;
import com.example.app.repositories.OrderRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserProfileService {
  private final AppUserRepository appUserRepository;
  private final OrderRepository orderRepository;
  private final UserAccountService userAccountService;

  public UserProfileService(
      AppUserRepository appUserRepository,
      OrderRepository orderRepository,
      UserAccountService userAccountService) {
    this.appUserRepository = appUserRepository;
    this.orderRepository = orderRepository;
    this.userAccountService = userAccountService;
  }

  @Transactional(readOnly = true)
  public UserMeResponse getProfile(String email) {
    AppUser user = appUserRepository.findByEmailIgnoreCase(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    ActiveSubscription active = resolveActiveSubscription(user);
    List<String> roles = List.of(user.getRole().name().toUpperCase(Locale.ROOT));

    return new UserMeResponse(
        user.getId(),
        user.getEmail(),
        user.getFullName(),
        user.getStatus().name(),
        roles,
        user.getReferralCode(),
        user.getReferredByCode(),
        user.getPdfCredits(),
        user.getPhoneNumber(),
        user.getDateOfBirth(),
        user.getGender(),
        user.getAddress(),
        active
    );
  }

  @Transactional
  public UserMeResponse updateProfile(String email, UpdateProfileRequest request) {
    AppUser user = appUserRepository.findByEmailIgnoreCase(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    user.setFullName(request.fullName().trim());
    user.setPhoneNumber(normalizeOptionalText(request.phoneNumber()));
    LocalDate dob = request.dateOfBirth();
    user.setDateOfBirth(dob);
    user.setGender(normalizeOptionalText(request.gender()));
    user.setAddress(normalizeOptionalText(request.address()));
    appUserRepository.save(user);

    return getProfile(email);
  }

  @Transactional
  public UserMeResponse registerAsPartner(String email) {
    AppUser user = appUserRepository.findByEmailIgnoreCase(email)
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    if (user.getRole() == UserRole.USER) {
      // Quốc Trí: giữ flow public "trở thành partner" hoạt động mà không đụng tới quyền admin hiện có.
      user.setRole(UserRole.PARTNER);
      appUserRepository.save(user);
    }

    userAccountService.ensureReferralCode(user);
    return getProfile(email);
  }

  private String normalizeOptionalText(String value) {
    if (value == null) {
      return null;
    }
    String normalized = value.trim();
    return normalized.isEmpty() ? null : normalized;
  }

  private ActiveSubscription resolveActiveSubscription(AppUser user) {
    Optional<Order> latestCompleted = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
        .stream()
        .filter(o -> o.getStatus() == OrderStatus.COMPLETED)
        .findFirst();

    if (latestCompleted.isEmpty()) {
      return null;
    }

    Order order = latestCompleted.get();
    String planCode = order.getCreditPackage() != null ? order.getCreditPackage().getCode() : "PAID";
    String planName = order.getCreditPackage() != null ? order.getCreditPackage().getName() : "Gói đã mua";
    long price = order.getAmountVnd();

    return new ActiveSubscription(
        planCode,
        planName,
        "ACTIVE",
        price,
        "VND",
        Boolean.FALSE,
        null
    );
  }
}
