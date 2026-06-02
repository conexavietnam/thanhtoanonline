package com.example.app.services;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.aryEq;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.app.models.Order;
import com.example.app.models.Result;
import com.example.app.models.TestSession;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class EmailServiceTest {

  @Test
  void verificationEmailUsesVietnameseCopy() {
    EmailSender emailSender = Mockito.mock(EmailSender.class);
    EmailService service = new EmailService(emailSender, "https://app.example", 1024);

    assertTrue(service.sendVerificationEmail("user@example.com", "verify-token"));

    verify(emailSender).send(
        "user@example.com",
        "Xác minh tài khoản DISCWAKE",
        contains("Cảm ơn bạn đã đăng ký tài khoản"));
  }

  @Test
  void paymentSuccessEmailUsesVietnameseCopy() {
    EmailSender emailSender = Mockito.mock(EmailSender.class);
    EmailService service = new EmailService(emailSender, "https://app.example", 1024);

    Order order = new Order();
    order.setId(UUID.randomUUID());
    order.setAmountVnd(468000);

    assertTrue(service.sendPaymentSuccessEmail("buyer@example.com", order));

    verify(emailSender).send(
        "buyer@example.com",
        "Xác nhận thanh toán thành công",
        contains("Cảm ơn bạn đã thanh toán thành công"));
  }

  @Test
  void discReportEmailAttachesPdfWhenSmallEnough() {
    EmailSender emailSender = Mockito.mock(EmailSender.class);
    EmailService service = new EmailService(emailSender, "https://app.example", 1024 * 1024);

    TestSession session = new TestSession();
    session.setId(UUID.randomUUID());
    session.setTakerName("Nguyen Van A");

    Result result = new Result();
    result.setSummary("Deep Coaching profile: DI");

    byte[] pdfBytes = new byte[] {1, 2, 3};

    assertTrue(service.sendDiscReportEmail("disc@example.com", session, result, pdfBytes));

    verify(emailSender).send(
        "disc@example.com",
        "Báo cáo DISC của bạn đã sẵn sàng",
        contains("đính kèm file PDF báo cáo"),
        anyString(),
        aryEq(pdfBytes));
  }

  @Test
  void discReportEmailFallsBackToLinkWhenTooLarge() {
    EmailSender emailSender = Mockito.mock(EmailSender.class);
    EmailService service = new EmailService(emailSender, "https://app.example", 1);

    TestSession session = new TestSession();
    session.setId(UUID.randomUUID());
    session.setTakerName("Nguyen Van A");

    Result result = new Result();
    result.setSummary("Deep Coaching profile: DI");

    byte[] pdfBytes = new byte[] {1, 2, 3};

    assertTrue(service.sendDiscReportEmail("disc@example.com", session, result, pdfBytes));

    verify(emailSender).send(
        "disc@example.com",
        "Báo cáo DISC của bạn đã sẵn sàng",
        contains("Báo cáo PDF của bạn đã sẵn sàng"));
    verify(emailSender, never()).send(
        anyString(),
        anyString(),
        anyString(),
        anyString(),
        any(byte[].class));
  }
}
