package com.example.app.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.app.dto.request.GoogleLoginRequest;
import com.example.app.dto.request.RegisterRequest;
import com.example.app.dto.response.MessageResponse;
import com.example.app.dto.response.RegisterResponse;
import com.example.app.models.AuthProvider;
import com.example.app.models.AppUser;
import com.example.app.models.EmailVerification;
import com.example.app.models.UserRole;
import com.example.app.models.UserStatus;
import com.example.app.repositories.AppUserRepository;
import com.example.app.repositories.EmailVerificationRepository;
import com.example.app.repositories.PasswordResetRepository;
import com.example.app.utils.ApiException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

  @Test
  void googleLoginAcceptsIdTokenWithoutOAuthSecret() {
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    JwtService jwtService = mock(JwtService.class);
    EmailVerificationRepository emailVerificationRepository = mock(EmailVerificationRepository.class);
    PasswordResetRepository passwordResetRepository = mock(PasswordResetRepository.class);
    RefreshTokenService refreshTokenService = mock(RefreshTokenService.class);
    GoogleTokenVerifierService googleTokenVerifierService = mock(GoogleTokenVerifierService.class);
    TokenService tokenService = mock(TokenService.class);
    EmailService emailService = mock(EmailService.class);
    UserAccountService userAccountService = mock(UserAccountService.class);
    AdminAuditLogService adminAuditLogService = mock(AdminAuditLogService.class);
    AuthService service = new AuthService(
        appUserRepository,
        passwordEncoder,
        jwtService,
        emailVerificationRepository,
        passwordResetRepository,
        refreshTokenService,
        googleTokenVerifierService,
        tokenService,
        emailService,
        userAccountService,
        adminAuditLogService,
        1440L,
        60L);

    GoogleLoginRequest request = new GoogleLoginRequest(
        "google-id-token",
        null,
        null,
        null);
    GoogleTokenVerifierService.GoogleIdentity identity =
        new GoogleTokenVerifierService.GoogleIdentity(
            "USER@gmail.com",
            "Test User",
            "https://example.com/avatar.png",
            "google-subject-123");

    when(googleTokenVerifierService.verifyIdToken(request.idToken())).thenReturn(identity);
    when(appUserRepository.findByEmailIgnoreCase("user@gmail.com")).thenReturn(Optional.empty());
    when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> {
      AppUser user = invocation.getArgument(0);
      if (user.getId() == null) {
        user.setId(UUID.randomUUID());
      }
      return user;
    });
    when(userAccountService.ensureReferralCode(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(jwtService.generateToken(any(AppUser.class))).thenReturn("access-token");
    when(refreshTokenService.create(any(AppUser.class))).thenReturn("refresh-token");

    service.googleLogin(request, "127.0.0.1");

    verify(googleTokenVerifierService).verifyIdToken("google-id-token");
    verify(googleTokenVerifierService, org.mockito.Mockito.never()).verifyAuthorizationCode(any(), any());
  }

  @Test
  void registerCreatesPendingUserAndSendsVerificationEmail() {
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    JwtService jwtService = mock(JwtService.class);
    EmailVerificationRepository emailVerificationRepository = mock(EmailVerificationRepository.class);
    PasswordResetRepository passwordResetRepository = mock(PasswordResetRepository.class);
    RefreshTokenService refreshTokenService = mock(RefreshTokenService.class);
    GoogleTokenVerifierService googleTokenVerifierService = mock(GoogleTokenVerifierService.class);
    TokenService tokenService = mock(TokenService.class);
    EmailService emailService = mock(EmailService.class);
    UserAccountService userAccountService = mock(UserAccountService.class);
    AdminAuditLogService adminAuditLogService = mock(AdminAuditLogService.class);
    AuthService service = new AuthService(
        appUserRepository,
        passwordEncoder,
        jwtService,
        emailVerificationRepository,
        passwordResetRepository,
        refreshTokenService,
        googleTokenVerifierService,
        tokenService,
        emailService,
        userAccountService,
        adminAuditLogService,
        1440L,
        60L);

    RegisterRequest request = new RegisterRequest("Test User", "USER@gmail.com", "password123", null);

    when(appUserRepository.existsByEmailIgnoreCase("user@gmail.com")).thenReturn(false);
    when(passwordEncoder.encode("password123")).thenReturn("encoded-password");
    when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> {
      AppUser user = invocation.getArgument(0);
      if (user.getId() == null) {
        user.setId(UUID.randomUUID());
      }
      return user;
    });
    when(userAccountService.ensureReferralCode(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(tokenService.generateToken()).thenReturn("raw-token");
    when(tokenService.hashToken("raw-token")).thenReturn("hashed-token");

    RegisterResponse response = service.register(request);

    ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
    verify(appUserRepository).save(userCaptor.capture());
    AppUser savedUser = userCaptor.getValue();
    assertEquals("user@gmail.com", savedUser.getEmail());
    assertEquals(UserRole.USER, savedUser.getRole());
    assertEquals(UserStatus.PENDING_VERIFICATION, savedUser.getStatus());
    assertFalse(savedUser.isEmailVerified());

    ArgumentCaptor<EmailVerification> verificationCaptor = ArgumentCaptor.forClass(EmailVerification.class);
    verify(emailVerificationRepository).save(verificationCaptor.capture());
    EmailVerification verification = verificationCaptor.getValue();
    assertEquals(savedUser, verification.getUser());
    assertEquals("hashed-token", verification.getTokenHash());
    assertNotNull(verification.getExpiresAt());

    verify(emailService).sendVerificationEmail("user@gmail.com", "raw-token");
    assertEquals("user@gmail.com", response.email());
  }

  @Test
  void registerRejectsReservedExampleDomain() {
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    JwtService jwtService = mock(JwtService.class);
    EmailVerificationRepository emailVerificationRepository = mock(EmailVerificationRepository.class);
    PasswordResetRepository passwordResetRepository = mock(PasswordResetRepository.class);
    RefreshTokenService refreshTokenService = mock(RefreshTokenService.class);
    GoogleTokenVerifierService googleTokenVerifierService = mock(GoogleTokenVerifierService.class);
    TokenService tokenService = mock(TokenService.class);
    EmailService emailService = mock(EmailService.class);
    UserAccountService userAccountService = mock(UserAccountService.class);
    AdminAuditLogService adminAuditLogService = mock(AdminAuditLogService.class);
    AuthService service = new AuthService(
        appUserRepository,
        passwordEncoder,
        jwtService,
        emailVerificationRepository,
        passwordResetRepository,
        refreshTokenService,
        googleTokenVerifierService,
        tokenService,
        emailService,
        userAccountService,
        adminAuditLogService,
        1440L,
        60L);

    RegisterRequest request = new RegisterRequest("Test User", "USER@example.com", "password123", null);

    ApiException exception = assertThrows(ApiException.class, () -> service.register(request));

    assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
    assertEquals("RESERVED_EMAIL_DOMAIN", exception.getCode());
  }

  @Test
  void verifyEmailActivatesUserAndMarksTokenUsed() {
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    JwtService jwtService = mock(JwtService.class);
    EmailVerificationRepository emailVerificationRepository = mock(EmailVerificationRepository.class);
    PasswordResetRepository passwordResetRepository = mock(PasswordResetRepository.class);
    RefreshTokenService refreshTokenService = mock(RefreshTokenService.class);
    GoogleTokenVerifierService googleTokenVerifierService = mock(GoogleTokenVerifierService.class);
    TokenService tokenService = mock(TokenService.class);
    EmailService emailService = mock(EmailService.class);
    UserAccountService userAccountService = mock(UserAccountService.class);
    AdminAuditLogService adminAuditLogService = mock(AdminAuditLogService.class);
    AuthService service = new AuthService(
        appUserRepository,
        passwordEncoder,
        jwtService,
        emailVerificationRepository,
        passwordResetRepository,
        refreshTokenService,
        googleTokenVerifierService,
        tokenService,
        emailService,
        userAccountService,
        adminAuditLogService,
        1440L,
        60L);

    AppUser user = new AppUser();
    user.setEmail("user@gmail.com");
    user.setStatus(UserStatus.PENDING_VERIFICATION);
    user.setEmailVerified(false);

    EmailVerification verification = new EmailVerification();
    verification.setUser(user);
    verification.setTokenHash("hashed-token");
    verification.setExpiresAt(Instant.now().plusSeconds(300));

    when(tokenService.hashToken("raw-token")).thenReturn("hashed-token");
    when(emailVerificationRepository.findByTokenHash("hashed-token")).thenReturn(Optional.of(verification));
    when(userAccountService.ensureReferralCode(user)).thenReturn(user);

    MessageResponse response = service.verifyEmail("raw-token");

    assertEquals("Email verified", response.message());
    assertTrue(user.isEmailVerified());
    assertEquals(UserStatus.ACTIVE, user.getStatus());
    assertNotNull(verification.getUsedAt());
    verify(emailVerificationRepository).save(verification);
    verify(userAccountService).ensureReferralCode(user);
  }

  @Test
  void loginRejectsPendingVerificationBeforePasswordCheck() {
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    JwtService jwtService = mock(JwtService.class);
    EmailVerificationRepository emailVerificationRepository = mock(EmailVerificationRepository.class);
    PasswordResetRepository passwordResetRepository = mock(PasswordResetRepository.class);
    RefreshTokenService refreshTokenService = mock(RefreshTokenService.class);
    GoogleTokenVerifierService googleTokenVerifierService = mock(GoogleTokenVerifierService.class);
    TokenService tokenService = mock(TokenService.class);
    EmailService emailService = mock(EmailService.class);
    UserAccountService userAccountService = mock(UserAccountService.class);
    AdminAuditLogService adminAuditLogService = mock(AdminAuditLogService.class);
    AuthService service = new AuthService(
        appUserRepository,
        passwordEncoder,
        jwtService,
        emailVerificationRepository,
        passwordResetRepository,
        refreshTokenService,
        googleTokenVerifierService,
        tokenService,
        emailService,
        userAccountService,
        adminAuditLogService,
        1440L,
        60L);

    AppUser user = new AppUser();
    user.setEmail("user@gmail.com");
    user.setRole(UserRole.PARTNER);
    user.setStatus(UserStatus.PENDING_VERIFICATION);
    user.setEmailVerified(false);
    user.setPasswordHash("encoded-password");

    when(appUserRepository.findByEmailIgnoreCase("user@gmail.com")).thenReturn(Optional.of(user));

    ApiException exception = assertThrows(
        ApiException.class,
        () -> service.login(new com.example.app.dto.request.LoginRequest("user@gmail.com", "password123"), "127.0.0.1"));

    assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
    assertEquals("EMAIL_NOT_VERIFIED", exception.getCode());
  }

  @Test
  void googleLoginCreatesUserWithUserRole() {
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    JwtService jwtService = mock(JwtService.class);
    EmailVerificationRepository emailVerificationRepository = mock(EmailVerificationRepository.class);
    PasswordResetRepository passwordResetRepository = mock(PasswordResetRepository.class);
    RefreshTokenService refreshTokenService = mock(RefreshTokenService.class);
    GoogleTokenVerifierService googleTokenVerifierService = mock(GoogleTokenVerifierService.class);
    TokenService tokenService = mock(TokenService.class);
    EmailService emailService = mock(EmailService.class);
    UserAccountService userAccountService = mock(UserAccountService.class);
    AdminAuditLogService adminAuditLogService = mock(AdminAuditLogService.class);
    AuthService service = new AuthService(
        appUserRepository,
        passwordEncoder,
        jwtService,
        emailVerificationRepository,
        passwordResetRepository,
        refreshTokenService,
        googleTokenVerifierService,
        tokenService,
        emailService,
        userAccountService,
        adminAuditLogService,
        1440L,
        60L);

    GoogleLoginRequest request = new GoogleLoginRequest(
        null,
        "auth-code",
        "http://localhost:5174",
        null);
    GoogleTokenVerifierService.GoogleIdentity identity =
        new GoogleTokenVerifierService.GoogleIdentity(
            "USER@gmail.com",
            "Test User",
            "https://example.com/avatar.png",
            "google-subject-123");

    when(googleTokenVerifierService.verifyAuthorizationCode(request.code(), request.redirectUri())).thenReturn(identity);
    when(appUserRepository.findByEmailIgnoreCase("user@gmail.com")).thenReturn(Optional.empty());
    when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> {
      AppUser user = invocation.getArgument(0);
      if (user.getId() == null) {
        user.setId(UUID.randomUUID());
      }
      return user;
    });
    when(userAccountService.ensureReferralCode(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(jwtService.generateToken(any(AppUser.class))).thenReturn("access-token");
    when(refreshTokenService.create(any(AppUser.class))).thenReturn("refresh-token");

    service.googleLogin(request, "127.0.0.1");

    ArgumentCaptor<AppUser> userCaptor = ArgumentCaptor.forClass(AppUser.class);
    verify(appUserRepository).save(userCaptor.capture());
    AppUser savedUser = userCaptor.getValue();
    assertEquals("user@gmail.com", savedUser.getEmail());
    assertEquals(AuthProvider.GOOGLE, savedUser.getAuthProvider());
    assertEquals(UserRole.USER, savedUser.getRole());
    assertEquals(UserStatus.ACTIVE, savedUser.getStatus());
    assertTrue(savedUser.isEmailVerified());
  }
}
