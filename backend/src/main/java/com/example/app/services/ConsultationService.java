package com.example.app.services;

import com.example.app.dto.request.ConsultationRequest;
import com.example.app.dto.response.ConsultationResponse;
import com.example.app.models.Consultation;
import com.example.app.models.TelegramMessage;
import com.example.app.repositories.ConsultationRepository;
import com.example.app.repositories.TelegramMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ConsultationService {
  private final ConsultationRepository consultationRepository;
  private final TelegramMessageRepository telegramMessageRepository;
  private final TelegramNotifier telegramNotifier;

  @Transactional
  public ConsultationResponse submit(ConsultationRequest request) {
    Consultation consultation = new Consultation();
    consultation.setName(request.name().trim());
    consultation.setPhone(normalize(request.phone()));
    consultation.setEmail(normalize(request.email()));
    consultation.setMessage(normalize(request.message()));

    Consultation saved = consultationRepository.save(consultation);

    String messageText = buildTelegramMessage(saved);
    TelegramNotifier.TelegramSendResult sendResult = telegramNotifier.send(messageText);

    TelegramMessage log = new TelegramMessage();
    log.setConsultation(saved);
    log.setChatId(sendResult.chatId());
    log.setMessageText(messageText);
    log.setStatus(sendResult.status());
    log.setErrorText(sendResult.errorText());
    telegramMessageRepository.save(log);

    return new ConsultationResponse(saved.getId(), "Consultation submitted");
  }

  private String normalize(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private String buildTelegramMessage(Consultation consultation) {
    String phone = consultation.getPhone() == null ? "N/A" : consultation.getPhone();
    String email = consultation.getEmail() == null ? "N/A" : consultation.getEmail();
    String message = consultation.getMessage() == null ? "N/A" : consultation.getMessage();

    return "New consultation\n"
        + "Name: " + consultation.getName() + "\n"
        + "Phone: " + phone + "\n"
        + "Email: " + email + "\n"
        + "Message: " + message;
  }
}
