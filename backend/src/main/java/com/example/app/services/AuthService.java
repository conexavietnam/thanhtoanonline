package com.example.app.services;

import com.example.app.dto.request.GoogleLoginRequest;
import com.example.app.dto.request.LoginRequest;
import com.example.app.dto.request.LogoutRequest;
import com.example.app.dto.request.RefreshRequest;
import com.example.app.dto.request.RegisterRequest;
import com.example.app.dto.request.ResetPasswordRequest;
import com.example.app.dto.response.AuthResponse;
import com.example.app.dto.response.MessageResponse;
import com.example.app.dto.response.RegisterResponse;
import com.example.app.dto.response.UserProfile;
import com.example.app.models.AppUser;
import com.example.app.models.AuthProvider;
import com.example.app.models.EmailVerification;
import com.example.app.models.PasswordReset;
import com.example.app.models.RefreshToken;
import com.example.app.models.UserRole;
import com.example.app.models.UserStatus;
import com.example.app.models.AuditActionType;
import com.example.app.repositories.AppUserRepository;
import com.example.app.repositories.EmailVerificationRepository;
import com.example.app.repositories.PasswordResetRepository;
import com.example.app.utils.ApiException;
import com.example.app.utils.EmailAddressPolicy;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final AppUserRepository appUserRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final EmailVerificationRepository emailVerificationRepository;
  private final PasswordResetRepository passwordResetRepository;
  private final RefreshTokenService refreshTokenService;
  private final GoogleTokenVerifierService googleTokenVerifierService;
  private final TokenService tokenService;
  private final EmailService emailService;
  private final UserAccountService userAccountService;
  private final AdminAuditLogService adminAuditLogService;
  private final long verificationExpiryMinutes;
  private final long resetExpiryMinutes;

  public AuthService(
      AppUserRepository appUserRepository,
      PasswordEncoder passwordEncoder,
      JwtService jwtService,
      EmailVerificationRepository emailVerificationRepository,
      PasswordResetRepository passwordResetRepository,
      RefreshTokenService refreshTokenService,
      GoogleTokenVerifierService googleTokenVerifierService,
      TokenService tokenService,
      EmailService emailService,
      UserAccountService userAccountService,
      AdminAuditLogService adminAuditLogService,
      @Value("${auth.verification-expiration-minutes:1440}") long verificationExpiryMinutes,
      @Value("${auth.reset-expiration-minutes:60}") long resetExpiryMinutes) {
    this.appUserRepository = appUserRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.emailVerificationRepository = emailVerificationRepository;
    this.passwordResetRepository = passwordResetRepository;
    this.refreshTokenService = refreshTokenService;
    this.googleTokenVerifierService = googleTokenVerifierService;
    this.tokenService = tokenService;
    this.emailService = emailService;
    this.userAccountService = userAccountService;
    this.adminAuditLogService = adminAuditLogService;
    this.verificationExpiryMinutes = verificationExpiryMinutes;
    this.resetExpiryMinutes = resetExpiryMinutes;
  }

  @Transactional
  public RegisterResponse register(RegisterRequest request) {
    String email = normalizeEmail(request.email());
    EmailAddressPolicy.assertAllowedForHumanAccount(email);
    if (appUserRepository.existsByEmailIgnoreCase(email)) {
      throw new ApiException(HttpStatus.CONFLICT, "EMAIL_EXISTS", "Email already registered");
    }

    AppUser user = new AppUser();
    user.setEmail(email);
    if (request.fullName() != null && !request.fullName().isBlank()) {
      user.setFullName(request.fullName().trim());
    }
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    // Quốc Trí: tài khoản tự đăng ký từ public auth phải mặc định là USER.
    user.setRole(UserRole.USER);
    // Quốc Trí: email/password sign-up must verify the mailbox before first login.
    user.setStatus(UserStatus.PENDING_VERIFICATION);
    user.setEmailVerified(false);
    user.setAuthProvider(AuthProvider.EMAIL);
    applyReferral(user, request.referralCode());

    AppUser saved = appUserRepository.save(user);
    saved = userAccountService.ensureReferralCode(saved);
    String verificationToken = createEmailVerification(saved);
    emailService.sendVerificationEmail(saved.getEmail(), verificationToken);

    return new RegisterResponse("Register success. Please verify your email.", saved.getEmail());
  }

  public AuthResponse login(LoginRequest request, String ipAddress) {
    String email = normalizeEmail(request.email());
    AppUser user = appUserRepository
        .findByEmailIgnoreCase(email)
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid credentials"));

    if (!user.isEmailVerified() || user.getStatus() == UserStatus.PENDING_VERIFICATION) {
      throw new ApiException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "Email not verified");
    }

    if (user.getStatus() != UserStatus.ACTIVE) {
      throw new ApiException(HttpStatus.FORBIDDEN, "USER_NOT_ACTIVE", "User is not active");
    }

    if (user.getAuthProvider() != null && user.getAuthProvider() != AuthProvider.EMAIL) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PROVIDER", "Use the correct login provider");
    }

    if (user.getPasswordHash() == null) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    userAccountService.ensureReferralCode(user);

    AuthResponse response = issueTokens(user);
    adminAuditLogService.log(
        AuditActionType.LOGIN,
        "AUTH",
        null,
        "User login",
        ipAddress,
        user);
    return response;
  }

  @Transactional
  public AuthResponse googleLogin(GoogleLoginRequest request, String ipAddress) {
    GoogleTokenVerifierService.GoogleIdentity identity = resolveGoogleIdentity(request);
    String email = normalizeEmail(identity.email());

    AppUser user = findOrCreateGoogleUser(email, identity, request.referralCode());
    if (user.getStatus() != UserStatus.ACTIVE) {
      throw new ApiException(HttpStatus.FORBIDDEN, "USER_NOT_ACTIVE", "User is not active");
    }

    AuthResponse response = issueTokens(user);
    adminAuditLogService.log(
        AuditActionType.LOGIN,
        "AUTH",
        null,
        "User login via Google",
        ipAddress,
        user);
    return response;
  }

  private GoogleTokenVerifierService.GoogleIdentity resolveGoogleIdentity(GoogleLoginRequest request) {
    String idToken = trimToNull(request.idToken());
    if (idToken != null) {
      // Quốc Trí: app chỉ cần xác thực đăng nhập nên ưu tiên id_token để không còn phụ thuộc redirect_uri.
      return googleTokenVerifierService.verifyIdToken(idToken);
    }

    String code = trimToNull(request.code());
    String redirectUri = trimToNull(request.redirectUri());
    if (code == null || redirectUri == null) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "INVALID_GOOGLE_PAYLOAD",
          "Google login payload is invalid");
    }

    return googleTokenVerifierService.verifyAuthorizationCode(code, redirectUri);
  }

  @Transactional
  public MessageResponse verifyEmail(String rawToken) {
    String tokenHash = tokenService.hashToken(rawToken);
    EmailVerification verification = emailVerificationRepository
        .findByTokenHash(tokenHash)
        .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN", "Invalid verification token"));

    AppUser user = verification.getUser();
    if (user.isEmailVerified()) {
      if (user.getStatus() != UserStatus.ACTIVE) {
        user.setStatus(UserStatus.ACTIVE);
      }
      userAccountService.ensureReferralCode(user);
      return new MessageResponse("Email verified");
    }

    if (verification.getUsedAt() != null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "TOKEN_USED", "Token already used");
    }

    if (verification.getExpiresAt().isBefore(Instant.now())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "TOKEN_EXPIRED", "Verification token expired");
    }

    verification.setUsedAt(Instant.now());
    emailVerificationRepository.save(verification);

    user.setEmailVerified(true);
    user.setStatus(UserStatus.ACTIVE);
    userAccountService.ensureReferralCode(user);

    return new MessageResponse("Email verified");
  }

  public MessageResponse resendVerification(String email) {
    String normalized = normalizeEmail(email);
    appUserRepository.findByEmailIgnoreCase(normalized).ifPresent(user -> {
      if (!user.isEmailVerified()) {
        String token = createEmailVerification(user);
        emailService.sendVerificationEmail(user.getEmail(), token);
      }
    });

    return new MessageResponse("If the email exists, a verification link has been sent");
  }

  public MessageResponse forgotPassword(String email) {
    String normalized = normalizeEmail(email);
    appUserRepository.findByEmailIgnoreCase(normalized).ifPresent(user -> {
      if (user.getAuthProvider() == AuthProvider.EMAIL) {
        String token = createPasswordReset(user);
        emailService.sendPasswordResetEmail(user.getEmail(), token);
      }
    });

    return new MessageResponse("If the email exists, a reset link has been sent");
  }

  @Transactional
  public MessageResponse resetPassword(ResetPasswordRequest request) {
    String tokenHash = tokenService.hashToken(request.token());
    PasswordReset passwordReset = passwordResetRepository.findByTokenHash(tokenHash)
        .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN", "Invalid reset token"));

    if (passwordReset.getUsedAt() != null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "TOKEN_USED", "Token already used");
    }

    if (passwordReset.getExpiresAt().isBefore(Instant.now())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "TOKEN_EXPIRED", "Reset token expired");
    }

    AppUser user = passwordReset.getUser();
    user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    appUserRepository.save(user);

    passwordReset.setUsedAt(Instant.now());
    passwordResetRepository.save(passwordReset);

    refreshTokenService.revokeAllForUser(user);

    return new MessageResponse("Password updated");
  }

  @Transactional
  public AuthResponse refresh(RefreshRequest request) {
    RefreshToken refreshToken = refreshTokenService.verify(request.refreshToken());
    AppUser user = refreshToken.getUser();

    if (user.getStatus() != UserStatus.ACTIVE) {
      throw new ApiException(HttpStatus.FORBIDDEN, "USER_NOT_ACTIVE", "User is not active");
    }

    String accessToken = jwtService.generateToken(user);
    String newRefreshToken = refreshTokenService.rotate(refreshToken);
    return AuthResponse.of(user, accessToken, newRefreshToken);
  }

  @Transactional
  public MessageResponse logout(LogoutRequest request) {
    refreshTokenService.revoke(request.refreshToken());
    return new MessageResponse("Logged out");
  }

  public UserProfile me(String email) {
    AppUser user = appUserRepository
        .findByEmailIgnoreCase(normalizeEmail(email))
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "NOT_AUTHENTICATED", "User not found"));

    return UserProfile.from(user);
  }

  private String normalizeEmail(String email) {
    return email.toLowerCase(Locale.ROOT).trim();
  }

  private String trimToNull(String value) {
    if (value == null) {
      return null;
    }

    String normalized = value.trim();
    return normalized.isEmpty() ? null : normalized;
  }

  private AppUser findOrCreateGoogleUser(
      String email,
      GoogleTokenVerifierService.GoogleIdentity identity,
      String referralCode) {
    EmailAddressPolicy.assertAllowedForHumanAccount(email);
    Optional<AppUser> existing = appUserRepository.findByEmailIgnoreCase(email);
    if (existing.isPresent()) {
      AppUser user = existing.get();
      if (user.getAuthProvider() == AuthProvider.EMAIL) {
        throw new ApiException(
            HttpStatus.CONFLICT,
            "PROVIDER_MISMATCH",
            "Account already exists with email/password provider"
        );
      }

      if (user.getStatus() == UserStatus.SUSPENDED) {
        throw new ApiException(HttpStatus.FORBIDDEN, "USER_NOT_ACTIVE", "User is not active");
      }

      user.setAuthProvider(AuthProvider.GOOGLE);
      user.setEmailVerified(true);
      user.setStatus(UserStatus.ACTIVE);
      updateGoogleProfile(user, identity);
      user = appUserRepository.save(user);
      return userAccountService.ensureReferralCode(user);
    }

    AppUser user = new AppUser();
    user.setEmail(email);
    user.setAuthProvider(AuthProvider.GOOGLE);
    // Quốc Trí: tài khoản Google mới tạo từ public auth cũng phải vào role USER.
    user.setRole(UserRole.USER);
    user.setStatus(UserStatus.ACTIVE);
    user.setEmailVerified(true);
    applyReferral(user, referralCode);
    updateGoogleProfile(user, identity);

    AppUser saved = appUserRepository.save(user);
    return userAccountService.ensureReferralCode(saved);
  }

  private void updateGoogleProfile(AppUser user, GoogleTokenVerifierService.GoogleIdentity identity) {
    if (identity.fullName() != null && !identity.fullName().isBlank()) {
      user.setFullName(identity.fullName().trim());
    }

    if (identity.pictureUrl() != null && !identity.pictureUrl().isBlank()) {
      user.setAvatarUrl(identity.pictureUrl().trim());
    }
  }

  private AuthResponse issueTokens(AppUser user) {
    String accessToken = jwtService.generateToken(user);
    String refreshToken = refreshTokenService.create(user);
    return AuthResponse.of(user, accessToken, refreshToken);
  }

  private String createEmailVerification(AppUser user) {
    String rawToken = tokenService.generateToken();
    EmailVerification verification = new EmailVerification();
    verification.setUser(user);
    verification.setTokenHash(tokenService.hashToken(rawToken));
    verification.setExpiresAt(Instant.now().plus(verificationExpiryMinutes, ChronoUnit.MINUTES));
    emailVerificationRepository.save(verification);
    return rawToken;
  }

  private String createPasswordReset(AppUser user) {
    String rawToken = tokenService.generateToken();
    PasswordReset passwordReset = new PasswordReset();
    passwordReset.setUser(user);
    passwordReset.setTokenHash(tokenService.hashToken(rawToken));
    passwordReset.setExpiresAt(Instant.now().plus(resetExpiryMinutes, ChronoUnit.MINUTES));
    passwordResetRepository.save(passwordReset);
    return rawToken;
  }

  private void applyReferral(AppUser user, String referralCode) {
    if (referralCode == null || referralCode.isBlank()) {
      return;
    }

    String normalizedCode = referralCode.trim().toUpperCase(Locale.ROOT);
    AppUser refUser = appUserRepository.findByReferralCode(normalizedCode)
        .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_REFERRAL", "Referral code is invalid"));
    user.setReferredByCode(refUser.getReferralCode());
  }
}
