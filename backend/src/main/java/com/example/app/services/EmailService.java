package com.example.app.services;

import com.example.app.models.Order;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
  private static final Logger log = LoggerFactory.getLogger(EmailService.class);
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

  public void sendPaymentSuccessEmail(String to, Order order) {
    try {
      String formattedAmount = NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN"))
          .format(order.getAmountVnd());
      String subject = "Xac nhan thanh toan don hang thanh cong";
      String body = String.format("""
          Don hang cua ban da duoc thanh toan thanh cong.
          Ma don hang: %s
          Goi: %s
          So tien: %s VND
          Trang thai: HOAN TAT
          
          Cam on ban da mua hang!
          """, order.getId(), order.getCreditPackage().getCode(), formattedAmount);
      emailSender.send(to, subject, body);
    } catch (Exception e) {
      log.error("Failed to send payment success email to {}: {}", to, e.getMessage());
    }
  }

  private String buildLink(String path, String token) {
    String encoded = URLEncoder.encode(token, StandardCharsets.UTF_8);
    return appBaseUrl + path + "?token=" + encoded;
  }
}
