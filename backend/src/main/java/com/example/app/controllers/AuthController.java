package com.example.app.controllers;

import com.example.app.dto.request.ForgotPasswordRequest;
import com.example.app.dto.request.GoogleLoginRequest;
import com.example.app.dto.request.LoginRequest;
import com.example.app.dto.request.LogoutRequest;
import com.example.app.dto.request.RefreshRequest;
import com.example.app.dto.request.RegisterRequest;
import com.example.app.dto.request.ResendVerificationRequest;
import com.example.app.dto.request.ResetPasswordRequest;
import com.example.app.dto.response.AuthResponse;
import com.example.app.dto.response.MessageResponse;
import com.example.app.dto.response.RegisterResponse;
import com.example.app.dto.response.UserProfile;
import com.example.app.services.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
  private final AuthService authService;

  @Value("${app.base-url:http://localhost:5174}")
  private String appBaseUrl;

  @PostMapping("/register")
  public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
    return authService.register(request);
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
    return authService.login(request, httpRequest.getRemoteAddr());
  }

  @PostMapping("/google")
  public AuthResponse googleLogin(@Valid @RequestBody GoogleLoginRequest request, HttpServletRequest httpRequest) {
    return authService.googleLogin(request, httpRequest.getRemoteAddr());
  }

  @PostMapping("/refresh")
  public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
    return authService.refresh(request);
  }

  @PostMapping("/logout")
  public MessageResponse logout(@Valid @RequestBody LogoutRequest request) {
    return authService.logout(request);
  }

  @PostMapping("/forgot")
  public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    return authService.forgotPassword(request.email());
  }

  @PostMapping("/reset")
  public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    return authService.resetPassword(request);
  }

  // Quốc Trí: giữ tương thích với link xác thực cũ đã gửi ra ngoài.
  @GetMapping({"/verify", "/email-verification/verify"})
  public ResponseEntity<?> verifyEmail(@RequestParam("token") String token, HttpServletRequest request) {
    if (isBrowserNavigation(request)) {
      String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
      return ResponseEntity.status(HttpStatus.FOUND)
          .location(URI.create(appBaseUrl + "/verify-email?token=" + encodedToken))
          .build();
    }

    return ResponseEntity.ok(authService.verifyEmail(token));
  }

  @PostMapping("/verify/resend")
  public MessageResponse resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
    return authService.resendVerification(request.email());
  }

  @GetMapping("/me")
  public UserProfile me(Authentication authentication) {
    return authService.me(authentication.getName());
  }

  private boolean isBrowserNavigation(HttpServletRequest request) {
    String secFetchDest = request.getHeader("Sec-Fetch-Dest");
    if (secFetchDest != null && secFetchDest.equalsIgnoreCase("document")) {
      return true;
    }

    String accept = request.getHeader("Accept");
    return accept != null && accept.contains("text/html");
  }
}
