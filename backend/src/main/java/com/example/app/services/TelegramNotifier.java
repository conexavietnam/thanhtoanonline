package com.example.app.services;

public interface TelegramNotifier {
  TelegramSendResult send(String messageText);

  record TelegramSendResult(String chatId, String status, String errorText) {
  }
}
