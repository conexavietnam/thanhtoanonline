package com.example.app.services;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
  private final EmailSender emailSender;
  private final String appBaseUrl;

  public EmailService(EmailSender emailSender, @Value("${app.base-url:http://localhost:5174}") String appBaseUrl) {
    this.emailSender = emailSender;
    this.appBaseUrl = appBaseUrl;
  }

  public void sendVerificationEmail(String to, String token) {
    String link = buildLink("/verify-email", token);
    String body = "Please verify your email by clicking this link: " + link;
    emailSender.send(to, "Verify your email", body);
  }

  public void sendPasswordResetEmail(String to, String token) {
    String link = buildLink("/reset-password", token);
    String body = "Reset your password using this link: " + link;
    emailSender.send(to, "Reset your password", body);
  }

  private String buildLink(String path, String token) {
    String encoded = URLEncoder.encode(token, StandardCharsets.UTF_8);
    return appBaseUrl + path + "?token=" + encoded;
  }
}
