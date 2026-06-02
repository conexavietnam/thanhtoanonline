package com.example.app.services;

import com.example.app.models.Order;
import com.example.app.models.Result;
import com.example.app.models.TestSession;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Locale;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {
  private static final long DEFAULT_MAX_ATTACHMENT_BYTES = 7L * 1024 * 1024;
  private final EmailSender emailSender;
  private final String appBaseUrl;
  private final long maxAttachmentBytes;

  public EmailService(
      EmailSender emailSender,
      @Value("${app.base-url:http://localhost:5174}") String appBaseUrl,
      @Value("${app.mail.max-attachment-bytes:7340032}") long maxAttachmentBytes) {
    this.emailSender = emailSender;
    this.appBaseUrl = appBaseUrl;
    this.maxAttachmentBytes = maxAttachmentBytes > 0 ? maxAttachmentBytes : DEFAULT_MAX_ATTACHMENT_BYTES;
  }

  public boolean sendVerificationEmail(String to, String token) {
    String link = buildLink("/verify-email", token);
    String subject = "Xác minh tài khoản DISCWAKE";
    String body = """
        Chào bạn,

        Cảm ơn bạn đã đăng ký tài khoản. Vui lòng xác minh email bằng liên kết bên dưới:
        %s

        Nếu bạn không thực hiện đăng ký, hãy bỏ qua email này.
        """.formatted(link);
    return sendTextEmail(to, subject, body);
  }

  public boolean sendPasswordResetEmail(String to, String token) {
    String link = buildLink("/reset-password", token);
    String subject = "Đặt lại mật khẩu DISCWAKE";
    String body = """
        Chào bạn,

        Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu. Vui lòng sử dụng liên kết bên dưới:
        %s

        Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.
        """.formatted(link);
    return sendTextEmail(to, subject, body);
  }

  public boolean sendPaymentSuccessEmail(String to, Order order) {
    try {
      String formattedAmount = NumberFormat.getNumberInstance(Locale.forLanguageTag("vi-VN"))
          .format(order.getAmountVnd());
      String subject = "Xác nhận thanh toán thành công";
      String body = """
          Chào bạn,

          Cảm ơn bạn đã thanh toán thành công cho đơn hàng của DISCWAKE.

          Mã đơn hàng: %s
          Mã thanh toán: %s
          Gói: %s
          Số tiền: %s VND
          Trạng thái: HOÀN TẤT

          Tài khoản của bạn đã được nâng cấp tự động.
          Bạn có thể đăng nhập để xem kết quả chi tiết và toàn bộ báo cáo DISC.
          """.formatted(
          order.getId(),
          order.getId(),
          order.getCreditPackage() == null ? "N/A" : order.getCreditPackage().getCode(),
          formattedAmount);
      emailSender.send(to, subject, body);
      log.info("EMAIL_SENT type=payment_success to={} orderId={}", to, order.getId());
      return true;
    } catch (Exception e) {
      log.error(
          "EMAIL_SEND_FAILED type=payment_success to={} orderId={} error={}",
          to,
          order == null ? null : order.getId(),
          e.getMessage(),
          e);
      return false;
    }
  }

  public boolean sendDiscReportEmail(String to, TestSession session, Result result, byte[] pdfBytes) {
    String subject = "Báo cáo DISC của bạn đã sẵn sàng";
    String dashboardLink = appBaseUrl + "/dashboard/results";
    String reportLink = dashboardLink;
    boolean attachPdf = pdfBytes != null && pdfBytes.length > 0 && pdfBytes.length <= maxAttachmentBytes;

    String body = buildDiscReportBody(session, result, attachPdf, reportLink);
    String fileName = buildDiscReportFileName(session);

    try {
      if (attachPdf) {
        emailSender.send(to, subject, body, fileName, pdfBytes);
      } else {
        emailSender.send(to, subject, body);
      }
      log.info(
          "EMAIL_SENT type=disc_report to={} sessionId={} attachmentBytes={}",
          to,
          session == null ? null : session.getId(),
          pdfBytes == null ? 0 : pdfBytes.length);
      return true;
    } catch (Exception e) {
      log.error(
          "EMAIL_SEND_FAILED type=disc_report to={} sessionId={} error={}",
          to,
          session == null ? null : session.getId(),
          e.getMessage(),
          e);
      return false;
    }
  }

  private boolean sendTextEmail(String to, String subject, String body) {
    try {
      emailSender.send(to, subject, body);
      log.info("EMAIL_SENT type=text to={} subject={}", to, subject);
      return true;
    } catch (Exception e) {
      log.error("EMAIL_SEND_FAILED type=text to={} subject={} error={}", to, subject, e.getMessage(), e);
      return false;
    }
  }

  private String buildDiscReportBody(TestSession session, Result result, boolean hasAttachment, String reportLink) {
    String takerName = session == null || session.getTakerName() == null || session.getTakerName().isBlank()
        ? "bạn"
        : session.getTakerName().trim();
    String summary = result == null || result.getSummary() == null || result.getSummary().isBlank()
        ? "Báo cáo DISC cá nhân của bạn"
        : result.getSummary().trim();

    if (hasAttachment) {
      return """
          Chào %s,

          Cảm ơn bạn đã hoàn thành bài test DISC. Chúng tôi đã đính kèm file PDF báo cáo của bạn trong email này.

          Mã phiên: %s
          Tóm tắt: %s

          Bạn có thể đăng nhập vào hệ thống để xem lại toàn bộ kết quả và tải báo cáo bất cứ lúc nào.

          Trân trọng,
          Đội ngũ DISCWAKE
          """.formatted(
          takerName,
          session == null ? "N/A" : session.getId(),
          summary);
    }

    return """
        Chào %s,

        Cảm ơn bạn đã hoàn thành bài test DISC. Báo cáo PDF của bạn đã sẵn sàng.

        Mã phiên: %s
        Tóm tắt: %s

        Bạn có thể đăng nhập và xem lại kết quả chi tiết tại:
        %s

        Trân trọng,
        Đội ngũ DISCWAKE
        """.formatted(
        takerName,
        session == null ? "N/A" : session.getId(),
        summary,
        reportLink);
  }

  private String buildDiscReportFileName(TestSession session) {
    if (session == null || session.getId() == null) {
      return "disc-report.pdf";
    }
    return "disc-report-" + session.getId() + ".pdf";
  }

  private String buildLink(String path, String token) {
    String encoded = URLEncoder.encode(token, StandardCharsets.UTF_8);
    return appBaseUrl + path + "?token=" + encoded;
  }
}
