package com.example.app.services;

import com.example.app.dto.request.ExportPdfRequest;
import com.example.app.dto.request.LegacyPdfPreviewRequest;
import com.example.app.dto.response.LegacyPdfExportCheckResponse;
import com.example.app.dto.response.PdfExportResponse;
import com.example.app.models.AppUser;
import com.example.app.models.TestMode;
import com.example.app.models.TestSession;
import com.example.app.repositories.TestSessionRepository;
import com.example.app.utils.ApiException;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LegacyPdfExportCompatService {
  private final UserAccountService userAccountService;
  private final TestSessionRepository testSessionRepository;
  private final PdfExportService pdfExportService;
  private final PdfDocumentService pdfDocumentService;

  public LegacyPdfExportCheckResponse check(String email, UUID testSessionId) {
    AppUser user = userAccountService.requireByEmail(email);
    TestSession session = null;
    if (testSessionId != null) {
      session = requireSession(user, testSessionId);
    }

    int credits = Math.max(0, user.getPdfCredits());
    boolean isFreeSession = session != null && session.getMode() == TestMode.FREE;
    boolean isPaidSession = session != null && session.getMode() == TestMode.PAID;

    if (isFreeSession) {
      return new LegacyPdfExportCheckResponse(
          true,
          -1,
          -1,
          "FREE",
          "FREE_PDF",
          true,
          -1,
          false,
          0
      );
    }

    boolean canExportPaid = credits > 0 || isPaidSession;
    int effectiveRemaining = canExportPaid ? Math.max(credits, 1) : 0;
    return new LegacyPdfExportCheckResponse(
        canExportPaid,
        effectiveRemaining,
        effectiveRemaining,
        "PAID",
        "PAID_PDF",
        false,
        0,
        canExportPaid,
        effectiveRemaining
    );
  }

  public byte[] download(String email, UUID testSessionId) {
    try {
      PdfExportResponse export = pdfExportService.export(email, new ExportPdfRequest(testSessionId));
      return pdfExportService.download(email, export.id());
    } catch (ApiException ex) {
      if ("NO_CREDIT".equals(ex.getCode())) {
        throw new ApiException(HttpStatus.FORBIDDEN, ex.getCode(), ex.getMessage());
      }
      throw ex;
    }
  }

  public byte[] preview(LegacyPdfPreviewRequest request) {
    Map<String, Object> templateConfig = request == null ? null : request.pdfTemplateConfig();
    String templateType = request == null ? null : request.templateType();
    return pdfDocumentService.buildTemplatePreviewPdf(templateType, templateConfig);
  }

  private TestSession requireSession(AppUser user, UUID sessionId) {
    return testSessionRepository.findByIdAndOwnerUserId(sessionId, user.getId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SESSION_NOT_FOUND", "Test session not found"));
  }
}
