package com.example.app.services;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {
  private final SecureRandom secureRandom = new SecureRandom();
  private final String hashSecret;

  public TokenService(@Value("${jwt.secret}") String hashSecret) {
    this.hashSecret = hashSecret;
  }

  public String generateToken() {
    byte[] bytes = new byte[32];
    secureRandom.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  public String hashToken(String rawToken) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] data = (hashSecret + ":" + rawToken).getBytes(StandardCharsets.UTF_8);
      byte[] hash = digest.digest(data);
      return HexFormat.of().formatHex(hash);
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to hash token", ex);
    }
  }
}
