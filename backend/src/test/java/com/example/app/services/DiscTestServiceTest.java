package com.example.app.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.app.dto.request.DiscTestSubmitRequest;
import com.example.app.dto.response.DiscTestResultResponse;
import com.example.app.models.AppUser;
import com.example.app.models.CreditTransaction;
import com.example.app.models.CreditTxType;
import com.example.app.models.Question;
import com.example.app.models.QuestionOption;
import com.example.app.models.Result;
import com.example.app.models.TestMode;
import com.example.app.models.TestSession;
import com.example.app.repositories.AppUserRepository;
import com.example.app.repositories.AnswerRepository;
import com.example.app.repositories.CreditTransactionRepository;
import com.example.app.repositories.QuestionRepository;
import com.example.app.repositories.ResultRepository;
import com.example.app.repositories.TestDefinitionRepository;
import com.example.app.repositories.TestSessionRepository;
import com.example.app.utils.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;

class DiscTestServiceTest {

  @Test
  void submitPaidTestConsumesOneCredit() {
    QuestionRepository questionRepository = mock(QuestionRepository.class);
    TestSessionRepository testSessionRepository = mock(TestSessionRepository.class);
    ResultRepository resultRepository = mock(ResultRepository.class);
    AnswerRepository answerRepository = mock(AnswerRepository.class);
    TestDefinitionRepository testDefinitionRepository = mock(TestDefinitionRepository.class);
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    CreditTransactionRepository creditTransactionRepository = mock(CreditTransactionRepository.class);
    UserAccountService userAccountService = mock(UserAccountService.class);
    AssessmentQuestionSelectionService assessmentQuestionSelectionService = mock(AssessmentQuestionSelectionService.class);

    DiscTestService service = new DiscTestService(
        questionRepository,
        testSessionRepository,
        resultRepository,
        answerRepository,
        testDefinitionRepository,
        appUserRepository,
        creditTransactionRepository,
        userAccountService,
        assessmentQuestionSelectionService,
        new ObjectMapper());

    AppUser owner = new AppUser();
    owner.setId(UUID.randomUUID());
    owner.setEmail("paid@example.com");
    owner.setFullName("Paid User");
    owner.setPdfCredits(1);

    QuestionOption option = new QuestionOption();
    option.setId(UUID.randomUUID());
    option.setLabel("D");
    option.setValue(5);
    option.setDiscDimension("D");
    option.setOrderIndex(1);

    Question question = new Question();
    question.setId(UUID.randomUUID());
    question.setTestCode("DISC_PAID");
    question.setContent("Question");
    question.setTraitKey("DISC_D");
    question.setWeight(BigDecimal.ONE);
    question.setOrderIndex(1);
    question.setOptions(List.of(option));
    option.setQuestion(question);

    DiscTestSubmitRequest request = new DiscTestSubmitRequest(
        List.of(new DiscTestSubmitRequest.AnswerItem(question.getId(), option.getId())),
        "general",
        "Paid User",
        "PAID");
    Authentication authentication = new UsernamePasswordAuthenticationToken(
        owner.getEmail(),
        "n/a",
        AuthorityUtils.NO_AUTHORITIES);

    when(questionRepository.countByTestCode("DISC_PAID")).thenReturn(1L);
    when(questionRepository.countByTestCode("BIG_FIVE")).thenReturn(0L);
    when(questionRepository.countByTestCode("IKIGAI")).thenReturn(0L);
    when(assessmentQuestionSelectionService.selectQuestions(anyList(), eq(TestMode.PAID))).thenReturn(List.of(question));
    when(userAccountService.requireByEmail(owner.getEmail())).thenReturn(owner);
    when(testSessionRepository.save(any(TestSession.class))).thenAnswer(invocation -> {
      TestSession session = invocation.getArgument(0);
      if (session.getId() == null) {
        session.setId(UUID.randomUUID());
      }
      return session;
    });
    when(answerRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
    when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(resultRepository.save(any(Result.class))).thenAnswer(invocation -> invocation.getArgument(0));

    DiscTestResultResponse response = service.submit(request, authentication);

    ArgumentCaptor<CreditTransaction> txCaptor = ArgumentCaptor.forClass(CreditTransaction.class);
    verify(creditTransactionRepository).save(txCaptor.capture());
    CreditTransaction tx = txCaptor.getValue();

    assertEquals(0, owner.getPdfCredits());
    assertEquals(CreditTxType.EXPORT_DEDUCT, tx.getType());
    assertEquals(-1, tx.getDelta());
    assertEquals(0, tx.getCreditsAfter());
    assertEquals("DISC_TEST", tx.getRefType());
    assertEquals("PAID", response.testMode());
    assertTrue(response.fullDetailUnlocked());
  }

  @Test
  void submitPaidTestWithoutCreditsIsRejected() {
    QuestionRepository questionRepository = mock(QuestionRepository.class);
    TestSessionRepository testSessionRepository = mock(TestSessionRepository.class);
    ResultRepository resultRepository = mock(ResultRepository.class);
    AnswerRepository answerRepository = mock(AnswerRepository.class);
    TestDefinitionRepository testDefinitionRepository = mock(TestDefinitionRepository.class);
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    CreditTransactionRepository creditTransactionRepository = mock(CreditTransactionRepository.class);
    UserAccountService userAccountService = mock(UserAccountService.class);
    AssessmentQuestionSelectionService assessmentQuestionSelectionService = mock(AssessmentQuestionSelectionService.class);

    DiscTestService service = new DiscTestService(
        questionRepository,
        testSessionRepository,
        resultRepository,
        answerRepository,
        testDefinitionRepository,
        appUserRepository,
        creditTransactionRepository,
        userAccountService,
        assessmentQuestionSelectionService,
        new ObjectMapper());

    AppUser owner = new AppUser();
    owner.setId(UUID.randomUUID());
    owner.setEmail("blocked@example.com");
    owner.setPdfCredits(0);

    QuestionOption option = new QuestionOption();
    option.setId(UUID.randomUUID());
    option.setLabel("D");
    option.setValue(5);
    option.setDiscDimension("D");
    option.setOrderIndex(1);

    Question question = new Question();
    question.setId(UUID.randomUUID());
    question.setTestCode("DISC_PAID");
    question.setContent("Question");
    question.setTraitKey("DISC_D");
    question.setWeight(BigDecimal.ONE);
    question.setOrderIndex(1);
    question.setOptions(List.of(option));
    option.setQuestion(question);

    DiscTestSubmitRequest request = new DiscTestSubmitRequest(
        List.of(new DiscTestSubmitRequest.AnswerItem(question.getId(), option.getId())),
        "general",
        "Blocked User",
        "PAID");
    Authentication authentication = new UsernamePasswordAuthenticationToken(
        owner.getEmail(),
        "n/a",
        AuthorityUtils.NO_AUTHORITIES);

    when(questionRepository.countByTestCode("DISC_PAID")).thenReturn(1L);
    when(questionRepository.countByTestCode("BIG_FIVE")).thenReturn(0L);
    when(questionRepository.countByTestCode("IKIGAI")).thenReturn(0L);
    when(assessmentQuestionSelectionService.selectQuestions(anyList(), eq(TestMode.PAID))).thenReturn(List.of(question));
    when(userAccountService.requireByEmail(owner.getEmail())).thenReturn(owner);

    ApiException exception = assertThrows(ApiException.class, () -> service.submit(request, authentication));

    assertEquals("PAID_ACCESS_REQUIRED", exception.getCode());
    verify(testSessionRepository, never()).save(any(TestSession.class));
    verify(appUserRepository, never()).save(any(AppUser.class));
    verify(creditTransactionRepository, never()).save(any(CreditTransaction.class));
  }
}
