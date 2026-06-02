package com.example.app.services;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.app.models.Order;
import com.example.app.models.Result;
import com.example.app.models.TestSession;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

class EmailServiceTest {

  @Test
  void verificationEmailUsesVietnameseCopy() {
    EmailSender emailSender = Mockito.mock(EmailSender.class);
    EmailService service = new EmailService(emailSender, "https://app.example", 1024);

    assertTrue(service.sendVerificationEmail("user@example.com", "verify-token"));

    verify(emailSender).send(
        eq("user@example.com"),
        eq("Xác minh tài khoản DISCWAKE"),
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
        eq("buyer@example.com"),
        eq("Xác nhận thanh toán thành công"),
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

    ArgumentCaptor<byte[]> attachmentCaptor = ArgumentCaptor.forClass(byte[].class);
    verify(emailSender).send(
        eq("disc@example.com"),
        eq("Báo cáo DISC của bạn đã sẵn sàng"),
        contains("đính kèm file PDF báo cáo"),
        anyString(),
        attachmentCaptor.capture());
    assertArrayEquals(pdfBytes, attachmentCaptor.getValue());
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
        eq("disc@example.com"),
        eq("Báo cáo DISC của bạn đã sẵn sàng"),
        contains("Báo cáo PDF của bạn đã sẵn sàng"));
    verify(emailSender, never()).send(
        anyString(),
        anyString(),
        anyString(),
        anyString(),
        any(byte[].class));
  }
}
