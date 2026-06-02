package com.example.app.services;

public interface EmailSender {
  void send(String to, String subject, String body);

  default void send(String to, String subject, String body, String attachmentName, byte[] attachmentBytes) {
    send(to, subject, body);
  }
}
