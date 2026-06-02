package com.example.app.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Real SMTP sender. Enabled when spring.mail.host is configured.
 */
@Service
@RequiredArgsConstructor
@ConditionalOnExpression("!'${spring.mail.host:}'.isEmpty()")
@Primary
@Slf4j
public class SmtpEmailSender implements EmailSender {
  private final JavaMailSender mailSender;

  @Value("${app.mail.from:no-reply@localhost}")
  private String fromAddress;

  @Override
  public void send(String to, String subject, String body) {
    SimpleMailMessage message = new SimpleMailMessage();
    message.setTo(to);
    if (fromAddress != null && !fromAddress.isBlank()) {
      message.setFrom(fromAddress);
    }
    message.setSubject(subject);
    message.setText(body);

    try {
      mailSender.send(message);
      log.info("EMAIL_SENT provider=smtp to={} subject={}", to, subject);
    } catch (MailException e) {
      log.error("EMAIL_SEND_FAILED provider=smtp to={} subject={} error={}", to, subject, e.getMessage(), e);
      throw e;
    }
  }
}
