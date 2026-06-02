package com.example.app.services;

import com.example.app.models.AppUser;
import com.example.app.models.RefreshToken;
import com.example.app.repositories.RefreshTokenRepository;
import com.example.app.utils.ApiException;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class RefreshTokenService {
  private final RefreshTokenRepository refreshTokenRepository;
  private final TokenService tokenService;
  private final long refreshExpirationMs;

  public RefreshTokenService(
      RefreshTokenRepository refreshTokenRepository,
      TokenService tokenService,
      @Value("${jwt.refresh-expiration-ms:1209600000}") long refreshExpirationMs) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.tokenService = tokenService;
    this.refreshExpirationMs = refreshExpirationMs;
  }

  public String create(AppUser user) {
    String rawToken = tokenService.generateToken();
    String tokenHash = tokenService.hashToken(rawToken);

    RefreshToken refreshToken = new RefreshToken();
    refreshToken.setUser(user);
    refreshToken.setTokenHash(tokenHash);
    refreshToken.setExpiresAt(Instant.now().plusMillis(refreshExpirationMs));

    refreshTokenRepository.save(refreshToken);
    return rawToken;
  }

  public RefreshToken verify(String rawToken) {
    String tokenHash = tokenService.hashToken(rawToken);
    RefreshToken refreshToken = refreshTokenRepository
        .findByTokenHash(tokenHash)
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", "Invalid refresh token"));

    if (refreshToken.getRevokedAt() != null) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_REVOKED", "Refresh token revoked");
    }

    if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_EXPIRED", "Refresh token expired");
    }

    return refreshToken;
  }

  public String rotate(RefreshToken refreshToken) {
    refreshToken.setRevokedAt(Instant.now());
    refreshTokenRepository.save(refreshToken);
    return create(refreshToken.getUser());
  }

  public void revoke(String rawToken) {
    String tokenHash = tokenService.hashToken(rawToken);
    refreshTokenRepository.findByTokenHash(tokenHash)
        .ifPresent(token -> {
          token.setRevokedAt(Instant.now());
          refreshTokenRepository.save(token);
        });
  }

  public void revokeAllForUser(AppUser user) {
    refreshTokenRepository.findByUserAndRevokedAtIsNull(user)
        .forEach(token -> {
          token.setRevokedAt(Instant.now());
          refreshTokenRepository.save(token);
        });
  }
}
