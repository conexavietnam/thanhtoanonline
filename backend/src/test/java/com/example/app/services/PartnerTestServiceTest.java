package com.example.app.services;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.app.dto.request.SubmitTestRequest;
import com.example.app.dto.response.TestResultResponse;
import com.example.app.models.AppUser;
import com.example.app.models.Result;
import com.example.app.models.SessionStatus;
import com.example.app.models.TestSession;
import com.example.app.repositories.AnswerRepository;
import com.example.app.repositories.CategoryRepository;
import com.example.app.repositories.PdfExportRepository;
import com.example.app.repositories.QuestionRepository;
import com.example.app.repositories.ResultRepository;
import com.example.app.repositories.TestDefinitionRepository;
import com.example.app.repositories.TestSessionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class PartnerTestServiceTest {

  @Test
  void completedSessionSubmitSendsDiscEmailOnce() {
    UserAccountService userAccountService = Mockito.mock(UserAccountService.class);
    TestDefinitionRepository testDefinitionRepository = Mockito.mock(TestDefinitionRepository.class);
    TestSessionRepository testSessionRepository = Mockito.mock(TestSessionRepository.class);
    QuestionRepository questionRepository = Mockito.mock(QuestionRepository.class);
    CategoryRepository categoryRepository = Mockito.mock(CategoryRepository.class);
    AnswerRepository answerRepository = Mockito.mock(AnswerRepository.class);
    ResultRepository resultRepository = Mockito.mock(ResultRepository.class);
    PdfExportRepository pdfExportRepository = Mockito.mock(PdfExportRepository.class);
    AssessmentQuestionSelectionService assessmentQuestionSelectionService =
        Mockito.mock(AssessmentQuestionSelectionService.class);
    EmailService emailService = Mockito.mock(EmailService.class);
    PdfDocumentService pdfDocumentService = Mockito.mock(PdfDocumentService.class);
    ObjectMapper objectMapper = new ObjectMapper();

    PartnerTestService service = new PartnerTestService(
        userAccountService,
        testDefinitionRepository,
        testSessionRepository,
        questionRepository,
        categoryRepository,
        answerRepository,
        resultRepository,
        pdfExportRepository,
        assessmentQuestionSelectionService,
        emailService,
        pdfDocumentService,
        objectMapper);

    AppUser owner = new AppUser();
    owner.setId(UUID.randomUUID());
    owner.setEmail("user@example.com");

    TestSession session = new TestSession();
    session.setId(UUID.randomUUID());
    session.setOwnerUser(owner);
    session.setTakerName("Nguyen Van A");
    session.setTestCode("DISC");
    session.setMode(com.example.app.models.TestMode.PAID);
    session.setStatus(SessionStatus.COMPLETED);
    session.setCompletedAt(Instant.now());

    Result result = new Result();
    result.setSession(session);
    result.setSummary("Deep Coaching profile: DI");
    result.setResultJson(objectMapper.createObjectNode().put("discPair", "DI"));

    when(userAccountService.requireByEmail(owner.getEmail())).thenReturn(owner);
    when(testSessionRepository.findByIdAndOwnerUserId(session.getId(), owner.getId()))
        .thenReturn(Optional.of(session));
    when(resultRepository.findBySessionId(session.getId())).thenReturn(Optional.of(result));
    when(pdfDocumentService.buildReportPdf(session, result)).thenReturn(new byte[] {1, 2, 3});
    when(emailService.sendDiscReportEmail(anyString(), any(TestSession.class), any(Result.class), any(byte[].class)))
        .thenReturn(true);
    when(testSessionRepository.save(any(TestSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

    TestResultResponse response = service.submit(owner.getEmail(), session.getId(), new SubmitTestRequest(null));

    assertEquals(session.getId(), response.sessionId());
    assertNotNull(session.getReportEmailSentAt());
    verify(emailService).sendDiscReportEmail(owner.getEmail(), session, result, new byte[] {1, 2, 3});
  }
}
