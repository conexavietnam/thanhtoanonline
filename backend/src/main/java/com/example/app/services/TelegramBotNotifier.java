package com.example.app.services;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class TelegramBotNotifier implements TelegramNotifier {
  private static final String STATUS_SENT = "SENT";
  private static final String STATUS_FAILED = "FAILED";
  private static final String UNKNOWN_CHAT = "UNCONFIGURED";

  private final RestClient restClient;
  private final boolean enabled;
  private final String botToken;
  private final String chatId;

  public TelegramBotNotifier(
      @Value("${telegram.enabled:false}") boolean enabled,
      @Value("${telegram.bot-token:}") String botToken,
      @Value("${telegram.chat-id:}") String chatId) {
    this.restClient = RestClient.create();
    this.enabled = enabled;
    this.botToken = botToken == null ? "" : botToken.trim();
    this.chatId = chatId == null ? "" : chatId.trim();
  }

  @Override
  public TelegramSendResult send(String messageText) {
    if (!enabled) {
      return new TelegramSendResult(safeChatId(), STATUS_FAILED, "Telegram disabled");
    }

    if (botToken.isBlank() || chatId.isBlank()) {
      return new TelegramSendResult(safeChatId(), STATUS_FAILED, "Telegram bot token or chat id is missing");
    }

    String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";
    try {
      restClient.post()
          .uri(url)
          .contentType(MediaType.APPLICATION_JSON)
          .body(Map.of("chat_id", chatId, "text", messageText))
          .retrieve()
          .toBodilessEntity();
      return new TelegramSendResult(chatId, STATUS_SENT, null);
    } catch (Exception ex) {
      String error = ex.getMessage() == null ? "Telegram request failed" : ex.getMessage();
      return new TelegramSendResult(chatId, STATUS_FAILED, error);
    }
  }

  private String safeChatId() {
    return chatId.isBlank() ? UNKNOWN_CHAT : chatId;
  }
}
