package com.example.app.utils;

import java.util.Locale;
import org.springframework.http.HttpStatus;

public final class EmailAddressPolicy {
  private static final String[] RESERVED_EXACT_DOMAINS = {
      "example.com",
      "example.net",
      "example.org",
      "localhost",
      "example",
      "test",
      "invalid"
  };

  private static final String[] RESERVED_DOMAIN_SUFFIXES = {
      ".example.com",
      ".example.net",
      ".example.org",
      ".localhost",
      ".example",
      ".test",
      ".invalid"
  };

  private EmailAddressPolicy() {
  }

  public static void assertAllowedForHumanAccount(String email) {
    if (isReservedDomain(email)) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "RESERVED_EMAIL_DOMAIN",
          "Vui lòng dùng email thật, không dùng địa chỉ mẫu hoặc email test");
    }
  }

  public static boolean isReservedDomain(String email) {
    String domain = extractDomain(email);
    if (domain == null) {
      return false;
    }

    for (String exactDomain : RESERVED_EXACT_DOMAINS) {
      if (domain.equals(exactDomain)) {
        return true;
      }
    }

    for (String suffix : RESERVED_DOMAIN_SUFFIXES) {
      if (domain.endsWith(suffix)) {
        return true;
      }
    }

    return false;
  }

  private static String extractDomain(String email) {
    if (email == null) {
      return null;
    }

    String normalized = email.trim().toLowerCase(Locale.ROOT);
    int atIndex = normalized.lastIndexOf('@');
    if (atIndex <= 0 || atIndex == normalized.length() - 1) {
      return null;
    }

    return normalized.substring(atIndex + 1);
  }
}
