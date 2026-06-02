package com.example.app.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.app.dto.request.ExportPdfRequest;
import com.example.app.dto.response.LegacyPdfExportCheckResponse;
import com.example.app.models.AppUser;
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
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PdfExportServiceTest {

  @Test
  void paidSessionExportSkipsCreditDeduction() {
    UserAccountService userAccountService = mock(UserAccountService.class);
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    TestSessionRepository testSessionRepository = mock(TestSessionRepository.class);
    ResultRepository resultRepository = mock(ResultRepository.class);
    PdfExportRepository pdfExportRepository = mock(PdfExportRepository.class);
    CreditTransactionRepository creditTransactionRepository = mock(CreditTransactionRepository.class);
    PdfDocumentService pdfDocumentService = mock(PdfDocumentService.class);

    PdfExportService service = new PdfExportService(
        userAccountService,
        appUserRepository,
        testSessionRepository,
        resultRepository,
        pdfExportRepository,
        creditTransactionRepository,
        pdfDocumentService);

    AppUser owner = new AppUser();
    owner.setId(UUID.randomUUID());
    owner.setEmail("paid@example.com");
    owner.setPdfCredits(0);

    TestSession session = new TestSession();
    session.setId(UUID.randomUUID());
    session.setOwnerUser(owner);
    session.setMode(TestMode.PAID);
    session.setStartedAt(Instant.now());
    session.setTakerName("Paid User");

    Result result = new Result();
    result.setSession(session);

    when(userAccountService.requireByEmail(owner.getEmail())).thenReturn(owner);
    when(testSessionRepository.findByIdAndOwnerUserId(session.getId(), owner.getId())).thenReturn(Optional.of(session));
    when(resultRepository.findBySessionId(session.getId())).thenReturn(Optional.of(result));
    when(pdfExportRepository.save(any(PdfExport.class))).thenAnswer(invocation -> {
      PdfExport export = invocation.getArgument(0);
      if (export.getId() == null) {
        export.setId(UUID.randomUUID());
      }
      return export;
    });
    when(pdfDocumentService.buildReportPdf(session, result)).thenThrow(new IllegalStateException("render failed"));

    ApiException exception = assertThrows(
        ApiException.class,
        () -> service.export(owner.getEmail(), new ExportPdfRequest(session.getId())));

    assertEquals("EXPORT_FAILED", exception.getCode());
    verify(appUserRepository, never()).save(any(AppUser.class));
    verify(creditTransactionRepository, never()).save(any());
    verify(pdfExportRepository, atLeastOnce()).save(any(PdfExport.class));
  }

  @Test
  void freeSessionExportSkipsCreditDeduction() {
    UserAccountService userAccountService = mock(UserAccountService.class);
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    TestSessionRepository testSessionRepository = mock(TestSessionRepository.class);
    ResultRepository resultRepository = mock(ResultRepository.class);
    PdfExportRepository pdfExportRepository = mock(PdfExportRepository.class);
    CreditTransactionRepository creditTransactionRepository = mock(CreditTransactionRepository.class);
    PdfDocumentService pdfDocumentService = mock(PdfDocumentService.class);

    PdfExportService service = new PdfExportService(
        userAccountService,
        appUserRepository,
        testSessionRepository,
        resultRepository,
        pdfExportRepository,
        creditTransactionRepository,
        pdfDocumentService);

    AppUser owner = new AppUser();
    owner.setId(UUID.randomUUID());
    owner.setEmail("free@example.com");
    owner.setPdfCredits(0);

    TestSession session = new TestSession();
    session.setId(UUID.randomUUID());
    session.setOwnerUser(owner);
    session.setMode(TestMode.FREE);
    session.setStartedAt(Instant.now());
    session.setTakerName("Free User");

    Result result = new Result();
    result.setSession(session);

    when(userAccountService.requireByEmail(owner.getEmail())).thenReturn(owner);
    when(testSessionRepository.findByIdAndOwnerUserId(session.getId(), owner.getId())).thenReturn(Optional.of(session));
    when(resultRepository.findBySessionId(session.getId())).thenReturn(Optional.of(result));

    when(pdfExportRepository.save(any(PdfExport.class))).thenAnswer(invocation -> {
      PdfExport export = invocation.getArgument(0);
      if (export.getId() == null) {
        export.setId(UUID.randomUUID());
      }
      return export;
    });
    when(pdfDocumentService.buildReportPdf(session, result)).thenThrow(new IllegalStateException("render failed"));

    ApiException exception = assertThrows(
        ApiException.class,
        () -> service.export(owner.getEmail(), new ExportPdfRequest(session.getId())));

    assertEquals("EXPORT_FAILED", exception.getCode());
    verify(appUserRepository, never()).save(any(AppUser.class));
    verify(creditTransactionRepository, never()).save(any());
    verify(pdfExportRepository, atLeastOnce()).save(any(PdfExport.class));
  }

  @Test
  void legacyCheckAllowsPaidSessionExportWithoutCredits() {
    UserAccountService userAccountService = mock(UserAccountService.class);
    TestSessionRepository testSessionRepository = mock(TestSessionRepository.class);
    PdfExportService pdfExportService = mock(PdfExportService.class);
    PdfDocumentService pdfDocumentService = mock(PdfDocumentService.class);

    LegacyPdfExportCompatService service = new LegacyPdfExportCompatService(
        userAccountService,
        testSessionRepository,
        pdfExportService,
        pdfDocumentService);

    AppUser user = new AppUser();
    user.setId(UUID.randomUUID());
    user.setEmail("legacy@example.com");
    user.setPdfCredits(0);

    TestSession session = new TestSession();
    session.setId(UUID.randomUUID());
    session.setOwnerUser(user);
    session.setMode(TestMode.PAID);

    when(userAccountService.requireByEmail(user.getEmail())).thenReturn(user);
    when(testSessionRepository.findByIdAndOwnerUserId(session.getId(), user.getId())).thenReturn(Optional.of(session));

    LegacyPdfExportCheckResponse response = service.check(user.getEmail(), session.getId());

    assertTrue(response.canExport());
    assertTrue(response.canExportPaid());
    assertEquals(1, response.remainingPaid());
    assertEquals(1, response.remaining());
  }

  @Test
  void legacyCheckAllowsFreeSessionExportWithoutCredits() {
    UserAccountService userAccountService = mock(UserAccountService.class);
    TestSessionRepository testSessionRepository = mock(TestSessionRepository.class);
    PdfExportService pdfExportService = mock(PdfExportService.class);
    PdfDocumentService pdfDocumentService = mock(PdfDocumentService.class);

    LegacyPdfExportCompatService service = new LegacyPdfExportCompatService(
        userAccountService,
        testSessionRepository,
        pdfExportService,
        pdfDocumentService);

    AppUser user = new AppUser();
    user.setId(UUID.randomUUID());
    user.setEmail("legacy-free@example.com");
    user.setPdfCredits(0);

    TestSession session = new TestSession();
    session.setId(UUID.randomUUID());
    session.setOwnerUser(user);
    session.setMode(TestMode.FREE);

    when(userAccountService.requireByEmail(user.getEmail())).thenReturn(user);
    when(testSessionRepository.findByIdAndOwnerUserId(session.getId(), user.getId())).thenReturn(Optional.of(session));

    LegacyPdfExportCheckResponse response = service.check(user.getEmail(), session.getId());

    assertTrue(response.canExport());
    assertTrue(response.canExportFree());
    assertFalse(response.canExportPaid());
    assertEquals("FREE", response.exportType());
    assertEquals("FREE_PDF", response.reportType());
    assertEquals(-1, response.remainingFree());
    assertEquals(-1, response.remaining());
  }

  @Test
  void legacyCheckWithoutCreditsAndWithoutSessionBlocksPaidExport() {
    UserAccountService userAccountService = mock(UserAccountService.class);
    TestSessionRepository testSessionRepository = mock(TestSessionRepository.class);
    PdfExportService pdfExportService = mock(PdfExportService.class);
    PdfDocumentService pdfDocumentService = mock(PdfDocumentService.class);

    LegacyPdfExportCompatService service = new LegacyPdfExportCompatService(
        userAccountService,
        testSessionRepository,
        pdfExportService,
        pdfDocumentService);

    AppUser user = new AppUser();
    user.setId(UUID.randomUUID());
    user.setEmail("legacy-no-credit@example.com");
    user.setPdfCredits(0);

    when(userAccountService.requireByEmail(user.getEmail())).thenReturn(user);

    LegacyPdfExportCheckResponse response = service.check(user.getEmail(), null);

    assertFalse(response.canExport());
    assertFalse(response.canExportPaid());
    assertEquals(0, response.remainingPaid());
    assertEquals(0, response.remaining());
  }
}
