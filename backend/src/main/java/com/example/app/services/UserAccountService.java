package com.example.app.services;

import com.example.app.models.AppUser;
import com.example.app.repositories.AppUserRepository;
import com.example.app.utils.ApiException;
import java.security.SecureRandom;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserAccountService {
  private static final String REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  private final AppUserRepository appUserRepository;
  private final SecureRandom secureRandom = new SecureRandom();

  public String normalizeEmail(String email) {
    return email.toLowerCase(Locale.ROOT).trim();
  }

  public AppUser requireByEmail(String email) {
    return appUserRepository
        .findByEmailIgnoreCase(normalizeEmail(email))
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "NOT_AUTHENTICATED", "User not found"));
  }

  @Transactional
  public AppUser ensureReferralCode(AppUser user) {
    if (user.getReferralCode() != null && !user.getReferralCode().isBlank()) {
      return user;
    }

    String code;
    do {
      code = randomCode(8);
    } while (appUserRepository.existsByReferralCode(code));

    user.setReferralCode(code);
    return appUserRepository.save(user);
  }

  private String randomCode(int length) {
    StringBuilder builder = new StringBuilder(length);
    for (int i = 0; i < length; i++) {
      builder.append(REF_CHARS.charAt(secureRandom.nextInt(REF_CHARS.length())));
    }
    return builder.toString();
  }
}
