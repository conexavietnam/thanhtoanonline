package com.example.app.services;

public interface EmailSender {
  void send(String to, String subject, String body);
}
