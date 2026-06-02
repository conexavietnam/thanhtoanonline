package com.example.app.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class ConsoleEmailSender implements EmailSender {
  @Override
  public void send(String to, String subject, String body) {
    log.info("EMAIL to={} subject={} body={}", to, subject, body);
  }

  @Override
  public void send(String to, String subject, String body, String attachmentName, byte[] attachmentBytes) {
    log.info(
        "EMAIL to={} subject={} attachment={} attachmentBytes={} body={}",
        to,
        subject,
        attachmentName,
        attachmentBytes == null ? 0 : attachmentBytes.length,
        body);
  }
}
