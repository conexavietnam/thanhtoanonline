package com.example.app.services;

import com.example.app.dto.request.AnswerItemRequest;
import com.example.app.dto.request.AutoSaveAnswersRequest;
import com.example.app.dto.request.CreateTestSessionRequest;
import com.example.app.dto.request.SubmitTestRequest;
import com.example.app.dto.response.DiscResultDetailResponse;
import com.example.app.dto.response.DiscResultItemResponse;
import com.example.app.dto.response.QuestionItemResponse;
import com.example.app.dto.response.SaveAnswersResponse;
import com.example.app.dto.response.TestQuestionSetResponse;
import com.example.app.dto.response.TestResultResponse;
import com.example.app.dto.response.TestSessionDetailResponse;
import com.example.app.dto.response.TestSessionListItemResponse;
import com.example.app.dto.response.TestSessionResponse;
import com.example.app.models.Answer;
import com.example.app.models.AppUser;
import com.example.app.models.Category;
import com.example.app.models.PdfExport;
import com.example.app.models.Question;
import com.example.app.models.QuestionOption;
import com.example.app.models.Result;
import com.example.app.models.SessionStatus;
import com.example.app.models.TestMode;
import com.example.app.models.TestSession;
import com.example.app.repositories.AnswerRepository;
import com.example.app.repositories.CategoryRepository;
import com.example.app.repositories.PdfExportRepository;
import com.example.app.repositories.QuestionRepository;
import com.example.app.repositories.ResultRepository;
import com.example.app.repositories.TestDefinitionRepository;
import com.example.app.repositories.TestSessionRepository;
import com.example.app.utils.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PartnerTestService {
  private static final long PAID_TEST_COST_VND = 300_000L;
  private static final int PAID_QUESTION_TARGET = 50;
  private static final Set<String> DISC_PAIR_SET = Set.of("DI", "IS", "SC", "CD");

  private final UserAccountService userAccountService;
  private final TestDefinitionRepository testDefinitionRepository;
  private final TestSessionRepository testSessionRepository;
  private final QuestionRepository questionRepository;
  private final CategoryRepository categoryRepository;
  private final AnswerRepository answerRepository;
  private final ResultRepository resultRepository;
  private final PdfExportRepository pdfExportRepository;
  private final AssessmentQuestionSelectionService assessmentQuestionSelectionService;
  private final EmailService emailService;
  private final PdfDocumentService pdfDocumentService;
  private final ObjectMapper objectMapper;

  @Transactional
  public TestSessionResponse createSession(String email, CreateTestSessionRequest request) {
    AppUser owner = userAccountService.requireByEmail(email);

    String normalizedTestCode = request.testCode().trim().toUpperCase(Locale.ROOT);
    testDefinitionRepository.findByCode(normalizedTestCode)
        .filter(def -> def.isActive())
        .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "TEST_NOT_FOUND", "Test definition not found"));

    if (request.mode() != TestMode.PAID) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "FREE_DISABLED", "Free mode has been removed");
    }

    if (owner.getPdfCredits() <= 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "NO_CREDIT", "Not enough credits for paid assessment");
    }

    TestSession session = new TestSession();
    session.setOwnerUser(owner);
    session.setTakerName(request.takerName().trim());
    session.setTestCode(normalizedTestCode);
    session.setMode(TestMode.PAID);
    session.setStatus(SessionStatus.IN_PROGRESS);
    session.setCostVnd(PAID_TEST_COST_VND);
    session.setNote(normalizeText(request.note()));

    TestSession saved = testSessionRepository.save(session);
    return toSessionResponse(saved, 0, resolveQuestionsForSession(saved).size());
  }

  public TestQuestionSetResponse getQuestions(String email, UUID sessionId) {
    TestSession session = requireSessionOwner(email, sessionId);
    List<Question> selected = resolveQuestionsForSession(session);

    List<QuestionItemResponse> questionResponses = selected.stream()
        .map(this::toQuestionItem)
        .toList();

    return new TestQuestionSetResponse(
        session.getId(),
        session.getTestCode(),
        session.getMode().name(),
        questionResponses.size(),
        questionResponses
    );
  }

  @Transactional
  public SaveAnswersResponse autosaveAnswers(String email, UUID sessionId, AutoSaveAnswersRequest request) {
    TestSession session = requireSessionOwner(email, sessionId);
    if (session.getStatus() != SessionStatus.IN_PROGRESS) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "SESSION_NOT_EDITABLE", "Session is not editable");
    }

    List<Question> selectedQuestions = resolveQuestionsForSession(session);
    saveAnswers(session, selectedQuestions, request.answers());

    long answeredCount = answerRepository.countBySessionId(session.getId());
    long totalQuestions = selectedQuestions.size();

    return new SaveAnswersResponse(
        session.getId(),
        answeredCount,
        totalQuestions,
        progressPercent(answeredCount, totalQuestions),
        "Answers saved"
    );
  }

  @Transactional
  public TestResultResponse submit(String email, UUID sessionId, SubmitTestRequest request) {
    AppUser owner = userAccountService.requireByEmail(email);
    TestSession session = requireSessionOwner(email, sessionId);
    if (session.getStatus() == SessionStatus.COMPLETED) {
      Result existing = resultRepository.findBySessionId(session.getId())
          .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "RESULT_NOT_FOUND", "Result not found"));
      sendDiscReportEmailIfNeeded(owner, session, existing);
      return new TestResultResponse(session.getId(), existing.getSummary(), existing.getResultJson());
    }

    List<Question> selectedQuestions = resolveQuestionsForSession(session);
    if (request != null && request.answers() != null && !request.answers().isEmpty()) {
      saveAnswers(session, selectedQuestions, request.answers());
    }

    List<Answer> answers = answerRepository.findBySessionId(session.getId());
    if (answers.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "NO_ANSWERS", "No answers submitted");
    }

    long answeredCount = answerRepository.countBySessionId(session.getId());
    long totalQuestions = selectedQuestions.size();
    if (answeredCount < totalQuestions) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "TEST_NOT_COMPLETED",
          "Please answer all questions before submitting"
      );
    }

    TestResultData resultData = calculateResult(session, selectedQuestions, answers);

    Result result = resultRepository.findBySessionId(session.getId()).orElseGet(Result::new);
    result.setSession(session);
    result.setResultJson(resultData.resultJson());
    result.setSummary(resultData.summary());
    resultRepository.save(result);

    session.setStatus(SessionStatus.COMPLETED);
    session.setCompletedAt(Instant.now());
    testSessionRepository.save(session);

    sendDiscReportEmailIfNeeded(owner, session, result);

    return new TestResultResponse(session.getId(), resultData.summary(), resultData.resultJson());
  }

  public List<TestSessionListItemResponse> listSessions(
      String email,
      Instant from,
      Instant to,
      String takerName) {
    AppUser owner = userAccountService.requireByEmail(email);

    List<TestSession> sessions = testSessionRepository.findByOwnerUserIdOrderByCreatedAtDesc(owner.getId());
    return sessions.stream()
        .filter(session -> from == null || !session.getCreatedAt().isBefore(from))
        .filter(session -> to == null || !session.getCreatedAt().isAfter(to))
        .filter(session -> takerName == null || takerName.isBlank() ||
            session.getTakerName().toLowerCase(Locale.ROOT).contains(takerName.toLowerCase(Locale.ROOT).trim()))
        .map(session -> {
          long answered = answerRepository.countBySessionId(session.getId());
          long total = resolveQuestionsForSession(session).size();
          ExportSummary exportSummary = summarizeExports(session.getId());
          return new TestSessionListItemResponse(
              session.getId(),
              session.getTestCode(),
              session.getMode().name(),
              session.getStatus().name(),
              session.getTakerName(),
              session.getCreatedAt(),
              session.getCompletedAt(),
              session.getCostVnd(),
              progressPercent(answered, total),
              exportSummary.count(),
              exportSummary.latestStatus(),
              exportSummary.latestFileUrl(),
              exportSummary.creditsAfterLatestExport(),
              exportSummary.note()
          );
        })
        .toList();
  }

  public TestSessionDetailResponse getSessionDetail(String email, UUID sessionId) {
    TestSession session = requireSessionOwner(email, sessionId);
    long answered = answerRepository.countBySessionId(session.getId());
    long total = resolveQuestionsForSession(session).size();
    ExportSummary exportSummary = summarizeExports(session.getId());

    Result result = resultRepository.findBySessionId(session.getId()).orElse(null);
    return new TestSessionDetailResponse(
        session.getId(),
        session.getTestCode(),
        session.getMode().name(),
        session.getStatus().name(),
        session.getTakerName(),
        session.getStartedAt(),
        session.getCompletedAt(),
        session.getCostVnd(),
        answered,
        total,
        progressPercent(answered, total),
        exportSummary.count(),
        exportSummary.latestStatus(),
        exportSummary.latestFileUrl(),
        exportSummary.creditsAfterLatestExport(),
        exportSummary.note(),
        result == null ? null : result.getSummary(),
        result == null ? null : result.getResultJson()
    );
  }

  public List<DiscResultItemResponse> listDiscResults(String email) {
    AppUser owner = userAccountService.requireByEmail(email);
    List<TestSession> sessions = testSessionRepository
        .findByOwnerUserIdAndStatusOrderByCreatedAtDesc(owner.getId(), SessionStatus.COMPLETED);

    List<DiscResultItemResponse> items = new ArrayList<>();
    for (TestSession session : sessions) {
      Result result = resultRepository.findBySessionId(session.getId()).orElse(null);
      if (result == null || result.getResultJson() == null) {
        continue;
      }
      String pair = readString(result.getResultJson(), "discPair");
      if (pair == null) {
        continue;
      }
      items.add(new DiscResultItemResponse(session.getId(), session.getTakerName(), pair, session.getCompletedAt()));
    }
    return items;
  }

  public DiscResultDetailResponse getDiscResultDetail(String email, UUID sessionId) {
    TestSession session = requireSessionOwner(email, sessionId);
    Result result = resultRepository.findBySessionId(session.getId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RESULT_NOT_FOUND", "Result not found"));

    JsonNode resultJson = result.getResultJson();
    String pair = readString(resultJson, "discPair");
    JsonNode coachingReport = resultJson == null ? null : resultJson.get("coachingReport");

    return new DiscResultDetailResponse(
        session.getId(),
        session.getTakerName(),
        pair,
        session.getCompletedAt(),
        coachingReport,
        resultJson
    );
  }

  private void saveAnswers(TestSession session, List<Question> selectedQuestions, List<AnswerItemRequest> items) {
    Set<UUID> questionIds = selectedQuestions.stream().map(Question::getId).collect(Collectors.toSet());

    for (AnswerItemRequest item : items) {
      if (!questionIds.contains(item.questionId())) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "QUESTION_NOT_IN_SESSION", "Question does not belong to this session");
      }
    }

    Map<UUID, Question> questionById = selectedQuestions.stream()
        .collect(Collectors.toMap(Question::getId, q -> q));

    for (AnswerItemRequest item : items) {
      Answer answer = answerRepository.findBySessionIdAndQuestionId(session.getId(), item.questionId()).orElseGet(Answer::new);
      answer.setSession(session);
      Question question = questionById.get(item.questionId());
      if (question == null) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "QUESTION_NOT_FOUND", "Question not found in session");
      }
      QuestionOption selectedOption = resolveAnswerOption(question, item);
      int resolvedValue = resolveAnswerValue(question, selectedOption, item);
      answer.setQuestion(question);
      answer.setOption(selectedOption);
      answer.setValue(resolvedValue);
      answerRepository.save(answer);
    }
  }

  private TestResultData calculateResult(TestSession session, List<Question> selectedQuestions, List<Answer> answers) {
    Map<UUID, Answer> answerByQuestionId = answers.stream()
        .collect(Collectors.toMap(a -> a.getQuestion().getId(), a -> a, (a, b) -> b));

    Map<String, Double> traitScoreSum = new HashMap<>();
    Map<String, Integer> traitCount = new HashMap<>();

    int answeredCount = 0;
    for (Question question : selectedQuestions) {
      Answer answer = answerByQuestionId.get(question.getId());
      if (answer == null) {
        continue;
      }

      answeredCount++;
      double value = answer.getValue();
      if (question.isReverseScored()) {
        value = 6 - value;
      }

      String trait = resolveTraitKey(question, answer.getOption());
      BigDecimal weighted = BigDecimal.valueOf(value).multiply(question.getWeight());
      traitScoreSum.merge(trait, weighted.doubleValue(), Double::sum);
      traitCount.merge(trait, 1, Integer::sum);
    }

    if (answeredCount == 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "NO_ANSWERS", "No answers submitted");
    }

    Map<String, Double> traitAvg = traitScoreSum.entrySet().stream()
        .collect(Collectors.toMap(
            Map.Entry::getKey,
            entry -> round(entry.getValue() / traitCount.getOrDefault(entry.getKey(), 1)),
            (a, b) -> b,
            LinkedHashMap::new
        ));

    Map<String, Double> disc = extractByPrefix(traitAvg, "DISC_");
    Map<String, Double> bigFive = extractByPrefix(traitAvg, "BIG5_");
    Map<String, Double> ikigai = extractByPrefix(traitAvg, "IKIGAI_");

    String discPair = resolveDiscPair(disc);
    String topTrait = traitAvg.entrySet().stream()
        .max(Map.Entry.comparingByValue())
        .map(Map.Entry::getKey)
        .orElse("N/A");

    ObjectNode coachingReport = buildCoachingReport(discPair, topTrait, disc, bigFive, ikigai);
    String summary = "Deep Coaching profile: " + profileLabel(discPair);

    ObjectNode json = objectMapper.createObjectNode();
    json.put("approach", "DEEP_COACHING");
    json.put("testCode", session.getTestCode());
    json.put("mode", session.getMode().name());
    json.put("answeredCount", answeredCount);
    json.put("totalQuestions", selectedQuestions.size());
    json.put("discPair", discPair);
    json.put("topTraitSignal", topTrait);
    json.set("bigFiveScores", objectMapper.valueToTree(normalizeBigFiveScores(bigFive)));
    json.set("ikigaiScores", objectMapper.valueToTree(normalizeIkigaiScores(ikigai)));
    json.set("coachingReport", coachingReport);

    return new TestResultData(summary, json);
  }

  private Map<String, Double> extractByPrefix(Map<String, Double> source, String prefix) {
    return source.entrySet().stream()
        .filter(entry -> entry.getKey().startsWith(prefix))
        .collect(Collectors.toMap(
            entry -> entry.getKey().substring(prefix.length()),
            Map.Entry::getValue,
            (a, b) -> b,
            LinkedHashMap::new
        ));
  }

  private Map<String, Double> normalizeBigFiveScores(Map<String, Double> scores) {
    LinkedHashMap<String, Double> normalized = new LinkedHashMap<>();
    normalized.put("openness", firstBigFiveScore(scores, "O", "OPENNESS"));
    normalized.put("conscientiousness", firstBigFiveScore(scores, "C", "CONSCIENTIOUSNESS"));
    normalized.put("extraversion", firstBigFiveScore(scores, "E", "EXTRAVERSION"));
    normalized.put("agreeableness", firstBigFiveScore(scores, "A", "AGREEABLENESS"));
    normalized.put("neuroticism", firstBigFiveScore(scores, "N", "NEUROTICISM"));
    return normalized;
  }

  private Double firstBigFiveScore(Map<String, Double> scores, String... keys) {
    if (scores == null || scores.isEmpty()) {
      return null;
    }
    for (String key : keys) {
      Double value = scores.get(key);
      if (value != null) {
        return value;
      }
    }
    return null;
  }

  private Map<String, Double> normalizeIkigaiScores(Map<String, Double> scores) {
    LinkedHashMap<String, Double> normalized = new LinkedHashMap<>();
    normalized.put("passion", firstIkigaiScore(scores, "LOVE", "PASSION"));
    normalized.put("strength", firstIkigaiScore(scores, "SKILL", "STRENGTH"));
    normalized.put("value", firstIkigaiScore(scores, "NEED", "VALUE"));
    normalized.put("opportunity", firstIkigaiScore(scores, "PAID", "OPPORTUNITY"));
    return normalized;
  }

  private Double firstIkigaiScore(Map<String, Double> scores, String... keys) {
    if (scores == null || scores.isEmpty()) {
      return null;
    }
    for (String key : keys) {
      Double value = scores.get(key);
      if (value != null) {
        return value;
      }
    }
    return null;
  }

  private String resolveDiscPair(Map<String, Double> disc) {
    if (disc.isEmpty()) {
      return "DI";
    }

    List<Map.Entry<String, Double>> sorted = new ArrayList<>(disc.entrySet());
    sorted.sort(Map.Entry.<String, Double>comparingByValue().reversed());

    if (sorted.size() >= 2) {
      String candidate = sorted.get(0).getKey() + sorted.get(1).getKey();
      if (DISC_PAIR_SET.contains(candidate)) {
        return candidate;
      }
    }

    String bestPair = "DI";
    double bestScore = Double.NEGATIVE_INFINITY;

    for (String pair : DISC_PAIR_SET) {
      double score = disc.getOrDefault(String.valueOf(pair.charAt(0)), 0.0)
          + disc.getOrDefault(String.valueOf(pair.charAt(1)), 0.0);
      if (score > bestScore) {
        bestScore = score;
        bestPair = pair;
      }
    }

    return bestPair;
  }

  private List<Question> resolveQuestionsForSession(TestSession session) {
    List<String> sourceCodes = resolveQuestionSourceCodes(session);
    return assessmentQuestionSelectionService.selectQuestions(sourceCodes, session.getMode());
  }

  private List<String> resolveQuestionSourceCodes(TestSession session) {
    String baseCode = session.getTestCode().toUpperCase(Locale.ROOT);
    if (baseCode.endsWith("_FREE")) {
      baseCode = baseCode.substring(0, baseCode.length() - "_FREE".length());
    }

    if (baseCode.startsWith("DISC")) {
      List<String> discCandidates = baseCode.endsWith("_PAID")
          ? List.of(baseCode, "DISC", "DISC_FREE")
          : List.of(baseCode + "_PAID", "DISC", "DISC_FREE");
      String resolvedDiscCode = resolveAvailableSourceCode(discCandidates);
      List<String> codes = new ArrayList<>();
      if (resolvedDiscCode != null) {
        codes.add(resolvedDiscCode);
      }
      if (testDefinitionRepository.findByCode("BIG_FIVE").isPresent()) {
        codes.add("BIG_FIVE");
      }
      if (testDefinitionRepository.findByCode("IKIGAI").isPresent()) {
        codes.add("IKIGAI");
      }
      return codes;
    }

    if (!baseCode.endsWith("_PAID")) {
      String candidate = baseCode + "_PAID";
      boolean hasCandidate = testDefinitionRepository.findByCode(candidate).isPresent();
      baseCode = hasCandidate ? candidate : baseCode;
    }

    return List.of(baseCode);
  }

  private String resolveAvailableSourceCode(List<String> codesByPriority) {
    for (String code : codesByPriority) {
      if (questionRepository.countByTestCode(code) > 0) {
        return code;
      }
    }
    return codesByPriority.stream()
        .filter(code -> testDefinitionRepository.findByCode(code).isPresent())
        .findFirst()
        .orElse(null);
  }

  private TestSession requireSessionOwner(String email, UUID sessionId) {
    AppUser owner = userAccountService.requireByEmail(email);
    return testSessionRepository.findByIdAndOwnerUserId(sessionId, owner.getId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "SESSION_NOT_FOUND", "Test session not found"));
  }

  private void sendDiscReportEmailIfNeeded(AppUser owner, TestSession session, Result result) {
    if (session == null || owner == null || result == null) {
      return;
    }

    if (session.getReportEmailSentAt() != null) {
      return;
    }

    byte[] pdfBytes = null;
    try {
      pdfBytes = pdfDocumentService.buildReportPdf(session, result);
    } catch (Exception ex) {
      log.warn("Failed to build DISC PDF for email session={} error={}", session.getId(), ex.getMessage());
    }

    boolean sent = emailService.sendDiscReportEmail(owner.getEmail(), session, result, pdfBytes);
    if (sent) {
      session.setReportEmailSentAt(Instant.now());
      testSessionRepository.save(session);
    }
  }

  private TestSessionResponse toSessionResponse(TestSession session, long answeredCount, long totalQuestions) {
    return new TestSessionResponse(
        session.getId(),
        session.getTestCode(),
        session.getMode().name(),
        session.getStatus().name(),
        session.getTakerName(),
        session.getStartedAt(),
        session.getCompletedAt(),
        session.getCostVnd(),
        answeredCount,
        totalQuestions,
        progressPercent(answeredCount, totalQuestions)
    );
  }

  private ExportSummary summarizeExports(UUID sessionId) {
    List<PdfExport> exports = pdfExportRepository.findBySessionIdOrderByCreatedAtDesc(sessionId);
    if (exports.isEmpty()) {
      return new ExportSummary(0, null, null, null, null);
    }

    PdfExport latest = exports.get(0);
    return new ExportSummary(
        exports.size(),
        latest.getStatus().name(),
        latest.getFileUrl(),
        latest.getCreditsAfterExport(),
        latest.getNote()
    );
  }

  private QuestionItemResponse toQuestionItem(Question question) {
    List<QuestionItemResponse.QuestionOptionResponse> options = question.getOptions().stream()
        .sorted(Comparator.comparingInt(o -> o.getOrderIndex()))
        .map(opt -> new QuestionItemResponse.QuestionOptionResponse(
            opt.getId(),
            opt.getLabel(),
            opt.getValue(),
            opt.getDiscDimension(),
            opt.getTraitOverride(),
            opt.getOrderIndex()
        ))
        .toList();

    return new QuestionItemResponse(
        question.getId(),
        question.getCategory() == null ? null : question.getCategory().getId(),
        question.getContent(),
        question.getTraitKey(),
        question.getOrderIndex(),
        options
    );
  }

  private int progressPercent(long answered, long total) {
    if (total <= 0) {
      return 0;
    }
    return (int) Math.min(100, (answered * 100) / total);
  }

  private String resolveTraitKey(Question question, QuestionOption option) {
    if (option != null) {
      if (option.getTraitOverride() != null && !option.getTraitOverride().isBlank()) {
        return option.getTraitOverride();
      }
      if (option.getDiscDimension() != null && question.getTestCode().toUpperCase(Locale.ROOT).startsWith("DISC")) {
        return "DISC_" + option.getDiscDimension();
      }
    }
    return question.getTraitKey();
  }

  private QuestionOption resolveAnswerOption(Question question, AnswerItemRequest item) {
    if (item.optionId() != null) {
      return question.getOptions().stream()
          .filter(opt -> opt.getId().equals(item.optionId()))
          .findFirst()
          .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "OPTION_NOT_FOUND", "Option not found for question"));
    }
    return null;
  }

  private int resolveAnswerValue(Question question, QuestionOption option, AnswerItemRequest item) {
    if (option != null) {
      return option.getValue();
    }
    if (item.value() == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "ANSWER_VALUE_REQUIRED", "value or optionId is required");
    }
    return item.value();
  }

  private String readString(JsonNode node, String key) {
    if (node == null || !node.hasNonNull(key)) {
      return null;
    }
    return node.get(key).asText();
  }

  private ObjectNode buildCoachingReport(
      String discPair,
      String topTrait,
      Map<String, Double> disc,
      Map<String, Double> bigFive,
      Map<String, Double> ikigai) {
    ObjectNode report = objectMapper.createObjectNode();
    report.put("framework", "DEEP_COACHING");
    report.put("profileCode", discPair);
    report.put("profileLabel", profileLabel(discPair));
    report.put("executiveSummary", buildExecutiveSummary(discPair, topTrait, disc, bigFive, ikigai));
    report.set("strengths", objectMapper.valueToTree(strengthsForPair(discPair, topTrait)));
    report.set("blindSpots", objectMapper.valueToTree(blindSpotsForPair(discPair)));
    report.set("communicationPlaybook", objectMapper.valueToTree(communicationPlaybookForPair(discPair)));
    report.set("wholesaleSalesPlaybook", objectMapper.valueToTree(wholesalePlaybookForPair(discPair, ikigai)));
    report.set("roadmap30Days", objectMapper.valueToTree(coachingRoadmap()));
    report.set("coachingQuestions", objectMapper.valueToTree(coachingQuestionsForPair(discPair)));
    report.set("prioritySignals", objectMapper.valueToTree(prioritySignals(bigFive, ikigai)));
    return report;
  }

  private String profileLabel(String discPair) {
    return switch (discPair) {
      case "DI" -> "Pioneer Influencer";
      case "IS" -> "Trusted Relationship Builder";
      case "SC" -> "Operational Quality Driver";
      case "CD" -> "Strategic Performance Architect";
      default -> "Strategic Growth Partner";
    };
  }

  private String buildExecutiveSummary(
      String discPair,
      String topTrait,
      Map<String, Double> disc,
      Map<String, Double> bigFive,
      Map<String, Double> ikigai) {
    String discSignal = joinOrDefault(topKeys(disc, 2), "DISC balanced");
    String personalitySignal = joinOrDefault(topKeys(bigFive, 2), "Big Five mixed");
    String motivationSignal = joinOrDefault(topKeys(ikigai, 2), "IKIGAI mixed");

    return "Profile "
        + discPair
        + " with dominant trait "
        + topTrait
        + ". High-impact signals: "
        + discSignal
        + ". Personality tendencies: "
        + personalitySignal
        + ". Motivation context for wholesale growth: "
        + motivationSignal
        + ".";
  }

  private List<String> strengthsForPair(String discPair, String topTrait) {
    List<String> strengths = new ArrayList<>();
    strengths.add("Strong execution energy around " + topTrait + ".");

    switch (discPair) {
      case "DI" -> {
        strengths.add("Drives growth conversations quickly and creates momentum in partner channels.");
        strengths.add("Can inspire wholesale teams to adopt new campaigns and products.");
      }
      case "IS" -> {
        strengths.add("Builds trust-based relationships with distributors and repeat buyers.");
        strengths.add("Maintains team alignment and service consistency across accounts.");
      }
      case "SC" -> {
        strengths.add("Delivers stable operations, detail control, and predictable service quality.");
        strengths.add("Excellent at retention through process discipline and reliability.");
      }
      case "CD" -> {
        strengths.add("Strong in strategic planning, data discipline, and performance optimization.");
        strengths.add("Drives decision quality with structure and measurable standards.");
      }
      default -> strengths.add("Flexible profile with potential for multi-role leadership.");
    }

    return strengths;
  }

  private List<String> blindSpotsForPair(String discPair) {
    return switch (discPair) {
      case "DI" -> List.of(
          "Risk of over-promising when speed is prioritized over feasibility.",
          "Needs tighter follow-through checkpoints after high-energy launches."
      );
      case "IS" -> List.of(
          "May delay hard decisions to avoid conflict with long-term partners.",
          "Needs stronger boundary-setting on low-margin wholesale requests."
      );
      case "SC" -> List.of(
          "Can become too cautious and slow in high-opportunity windows.",
          "Needs deliberate experimentation cadence to avoid stagnation."
      );
      case "CD" -> List.of(
          "Can communicate too critically under pressure and reduce team confidence.",
          "Needs simplified messaging for non-technical distributors."
      );
      default -> List.of("No major blind spots identified. Continue coaching validation.");
    };
  }

  private List<String> communicationPlaybookForPair(String discPair) {
    return switch (discPair) {
      case "DI" -> List.of(
          "Open meetings with target outcomes, then confirm commitments in writing.",
          "Use short commercial narratives, avoid excessive technical detail."
      );
      case "IS" -> List.of(
          "Anchor communication in relationship context and mutual benefit.",
          "Use structured check-ins to surface hidden objections early."
      );
      case "SC" -> List.of(
          "Share clear process maps, service levels, and execution deadlines.",
          "Increase persuasion impact by adding concise business storytelling."
      );
      case "CD" -> List.of(
          "Lead with facts and margins, then translate into practical action plans.",
          "Use coaching language to keep accountability without demotivating teams."
      );
      default -> List.of("Use adaptive communication by audience maturity.");
    };
  }

  private List<String> wholesalePlaybookForPair(String discPair, Map<String, Double> ikigai) {
    String motivationSignal = joinOrDefault(topKeys(ikigai, 2), "mixed IKIGAI drivers");
    List<String> playbook = new ArrayList<>();
    playbook.add("Prioritize partner segmentation by revenue, growth potential, and service load.");
    playbook.add("Package offers into clear tiers with measurable outcomes and support SLA.");
    playbook.add("Motivation signal to leverage: " + motivationSignal + ".");

    switch (discPair) {
      case "DI" -> playbook.add("Run quarterly growth sprints for top distributors with clear stretch goals.");
      case "IS" -> playbook.add("Deploy relationship-based retention scripts and high-touch partner cadence.");
      case "SC" -> playbook.add("Standardize wholesale onboarding and fulfillment quality controls.");
      case "CD" -> playbook.add("Implement margin dashboards and account profitability review rituals.");
      default -> playbook.add("Blend strategy, relationship, and execution controls by account maturity.");
    }

    return playbook;
  }

  private List<String> coachingRoadmap() {
    return List.of(
        "Week 1: Diagnose portfolio quality, classify wholesale accounts, and define growth gaps.",
        "Week 2: Align communication scripts and objection handling by partner segment.",
        "Week 3: Run focused execution sprint with measurable conversion and retention KPIs.",
        "Week 4: Review outcomes, adjust playbook, and lock next-cycle coaching priorities."
    );
  }

  private List<String> coachingQuestionsForPair(String discPair) {
    return List.of(
        "Which wholesale segment is currently over-served but under-profitable?",
        "What behavior shift is required from the account team in the next 30 days?",
        "How will " + discPair + " leadership style be calibrated to improve margin and retention?"
    );
  }

  private List<String> prioritySignals(Map<String, Double> bigFive, Map<String, Double> ikigai) {
    List<String> signals = new ArrayList<>();
    signals.add("Big Five focus: " + joinOrDefault(topKeys(bigFive, 2), "mixed"));
    signals.add("IKIGAI focus: " + joinOrDefault(topKeys(ikigai, 2), "mixed"));
    return signals;
  }

  private List<String> topKeys(Map<String, Double> source, int limit) {
    if (source == null || source.isEmpty()) {
      return List.of();
    }

    return source.entrySet().stream()
        .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
        .limit(Math.max(1, limit))
        .map(Map.Entry::getKey)
        .toList();
  }

  private String joinOrDefault(List<String> items, String defaultValue) {
    if (items == null || items.isEmpty()) {
      return defaultValue;
    }
    return String.join(", ", items);
  }

  private double round(double value) {
    return BigDecimal.valueOf(value).setScale(4, RoundingMode.HALF_UP).doubleValue();
  }

  private String normalizeText(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private record TestResultData(String summary, JsonNode resultJson) {
  }

  private record ExportSummary(
      long count,
      String latestStatus,
      String latestFileUrl,
      Integer creditsAfterLatestExport,
      String note
  ) {
  }
}
