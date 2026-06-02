package com.example.app.services;

import com.example.app.dto.request.ExportPdfRequest;
import com.example.app.dto.response.PdfExportResponse;
import com.example.app.models.AppUser;
import com.example.app.models.CreditTransaction;
import com.example.app.models.CreditTxType;
import com.example.app.models.ExportStatus;
import com.example.app.models.PdfExport;
import com.example.app.models.Result;
import com.example.app.models.TestMode;
import com.example.app.models.TestSession;
import com.example.app.repositories.AppUserRepository;
import com.example.app.repositories.CreditTransactionRepository;
import com.example.app.repositories.PdfExportRepository;
import com.example.app.repositories.ResultRepository;
import com.example.app.repositories.TestSessionRepository;
import com.example.app.utils.ApiException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PdfExportService {
  private static final Path EXPORT_DIR = Path.of("backend", "storage", "exports");
  private static final String EXPORT_NOTE_PREFIX = "Báo cáo Deep Coaching cá nhân hóa. Còn ";
  private static final String FAILED_EXPORT_NOTE = "Xuất lỗi, đã hoàn 1 lượt xuất";

  private final UserAccountService userAccountService;
  private final AppUserRepository appUserRepository;
  private final TestSessionRepository testSessionRepository;
  private final ResultRepository resultRepository;
  private final PdfExportRepository pdfExportRepository;
  private final CreditTransactionRepository creditTransactionRepository;
  private final PdfDocumentService pdfDocumentService;

  @Transactional
  public PdfExportResponse export(String email, ExportPdfRequest request) {
    AppUser owner = userAccountService.requireByEmail(email);
    TestSession session = requireSession(owner, request.sessionId());
    return exportSession(owner, session);
  }

  public List<PdfExportResponse> list(String email) {
    AppUser owner = userAccountService.requireByEmail(email);
    return pdfExportRepository.findBySessionOwnerUserIdOrderByCreatedAtDesc(owner.getId()).stream()
        .map(this::toResponse)
        .toList();
  }

  public PdfExportResponse detail(String email, UUID exportId) {
    AppUser owner = userAccountService.requireByEmail(email);
    PdfExport export = pdfExportRepository.findByIdAndSessionOwnerUserId(exportId, owner.getId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EXPORT_NOT_FOUND", "Export not found"));
    return toResponse(export);
  }

  @Transactional
  public PdfExportResponse retry(String email, UUID exportId) {
    AppUser owner = userAccountService.requireByEmail(email);
    PdfExport previous = pdfExportRepository.findByIdAndSessionOwnerUserId(exportId, owner.getId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EXPORT_NOT_FOUND", "Export not found"));

    return exportSession(owner, previous.getSession());
  }

  public byte[] download(String email, UUID exportId) {
    AppUser owner = userAccountService.requireByEmail(email);
    PdfExport export = pdfExportRepository.findByIdAndSessionOwnerUserId(exportId, owner.getId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EXPORT_NOT_FOUND", "Export not found"));

    if (export.getStatus() != ExportStatus.SUCCESS || export.getFilePath() == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "EXPORT_NOT_READY", "Export file is not ready");
    }

    try {
      return Files.readAllBytes(Path.of(export.getFilePath()));
    } catch (IOException ex) {
      throw new ApiException(HttpStatus.NOT_FOUND, "EXPORT_FILE_MISSING", "Export file not found");
    }
  }

  private PdfExportResponse exportSession(AppUser owner, TestSession session) {
    Result result = resultRepository.findBySessionId(session.getId())
        .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "RESULT_NOT_FOUND", "Submit test before exporting"));

    boolean deducted = deductExportCreditIfNeeded(owner, session);

    PdfExport export = new PdfExport();
    export.setSession(session);
    export.setMode(session.getMode());
    export.setStatus(ExportStatus.FAILED);
    export.setCreditsAfterExport(owner.getPdfCredits());
    export.setNote(buildExportNote(owner.getPdfCredits()));
    export = pdfExportRepository.save(export);

    try {
      byte[] pdfBytes = pdfDocumentService.buildReportPdf(session, result);
      Files.createDirectories(EXPORT_DIR);

      String fileName = export.getId() + ".pdf";
      Path path = EXPORT_DIR.resolve(fileName).toAbsolutePath();
      Files.write(path, pdfBytes);

      export.setStatus(ExportStatus.SUCCESS);
      export.setFilePath(path.toString());
      export.setFileUrl("/api/partner/exports/" + export.getId() + "/download");
      export.setErrorText(null);
      export.setCreditsAfterExport(owner.getPdfCredits());
      export.setNote(buildExportNote(owner.getPdfCredits()));
      pdfExportRepository.save(export);

      return toResponse(export);
    } catch (Exception ex) {
      export.setStatus(ExportStatus.FAILED);
      export.setErrorText(ex.getMessage());

      if (deducted) {
        refundExportCredit(owner, session, export.getId());
        export.setCreditsAfterExport(owner.getPdfCredits());
        export.setNote(FAILED_EXPORT_NOTE);
      }

      pdfExportRepository.save(export);

      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "EXPORT_FAILED", "PDF export failed");
    }
  }

  private boolean deductExportCreditIfNeeded(AppUser owner, TestSession session) {
    if (session != null && (session.getMode() == TestMode.PAID || session.getMode() == TestMode.FREE)) {
      return false;
    }

    if (owner.getPdfCredits() <= 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "NO_CREDIT", "Not enough PDF credits");
    }

    owner.setPdfCredits(owner.getPdfCredits() - 1);
    appUserRepository.save(owner);

    CreditTransaction tx = new CreditTransaction();
    tx.setUser(owner);
    tx.setType(CreditTxType.EXPORT_DEDUCT);
    tx.setDelta(-1);
    tx.setCreditsAfter(owner.getPdfCredits());
    tx.setRefType("EXPORT");
    tx.setRefId(session.getId());
    tx.setNote("Paid PDF export");
    creditTransactionRepository.save(tx);

    return true;
  }

  private void refundExportCredit(AppUser owner, TestSession session, UUID exportId) {
    owner.setPdfCredits(owner.getPdfCredits() + 1);
    appUserRepository.save(owner);

    CreditTransaction tx = new CreditTransaction();
    tx.setUser(owner);
    tx.setType(CreditTxType.REFUND);
    tx.setDelta(1);
    tx.setCreditsAfter(owner.getPdfCredits());
    tx.setRefType("EXPORT");
    tx.setRefId(exportId);
    tx.setNote("Refund credit due to failed export for session " + session.getId());
    creditTransactionRepository.save(tx);
  }

  private TestSession requireSession(AppUser owner, UUID sessionId) {
    return testSessionRepository.findByIdAndOwnerUserId(sessionId, owner.getId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SESSION_NOT_FOUND", "Test session not found"));
  }

  private PdfExportResponse toResponse(PdfExport export) {
    TestSession session = export.getSession();
    Instant testDate = session.getCompletedAt() == null ? session.getStartedAt() : session.getCompletedAt();
    return new PdfExportResponse(
        export.getId(),
        session.getId(),
        session.getTakerName(),
        testDate,
        session.getCostVnd(),
        export.getMode().name(),
        export.getStatus().name(),
        export.getFileUrl(),
        export.getErrorText(),
        export.getCreditsAfterExport(),
        export.getNote(),
        export.getCreatedAt()
    );
  }

  private String buildExportNote(int creditsAfterExport) {
    return EXPORT_NOTE_PREFIX + Math.max(0, creditsAfterExport) + " lượt xuất";
  }
}
