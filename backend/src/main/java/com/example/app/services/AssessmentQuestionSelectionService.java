package com.example.app.services;

import com.example.app.models.Category;
import com.example.app.models.Question;
import com.example.app.models.TestMode;
import com.example.app.repositories.CategoryRepository;
import com.example.app.repositories.QuestionRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AssessmentQuestionSelectionService {
  private static final String FREE_SETTINGS_KEY = "questionDistributionFree";
  private static final String PAID_SETTINGS_KEY = "questionDistributionPaid";
  private static final String DISC_KEY = "disc";
  private static final String BIG_FIVE_KEY = "bigFive";
  private static final String IKIGAI_KEY = "ikigai";

  private final QuestionRepository questionRepository;
  private final CategoryRepository categoryRepository;
  private final AdminSettingsService adminSettingsService;

  public List<Question> selectQuestions(List<String> sourceCodes, TestMode mode) {
    if (sourceCodes == null || sourceCodes.isEmpty()) {
      return List.of();
    }

    Map<String, Integer> requestedTargets = resolveRequestedTargets(mode);
    Map<String, Integer> codeOrder = new HashMap<>();
    for (int index = 0; index < sourceCodes.size(); index++) {
      codeOrder.put(sourceCodes.get(index), index);
    }

    List<Question> selected = new ArrayList<>();
    for (String sourceCode : sourceCodes) {
      List<Question> pool = questionRepository.findByTestCodeOrderByOrderIndexAscCreatedAtAsc(sourceCode);
      if (pool.isEmpty()) {
        continue;
      }

      int target = resolveTargetForCode(sourceCode, pool.size(), requestedTargets);
      if (target <= 0) {
        continue;
      }

      selected.addAll(selectQuestionsForCode(sourceCode, pool, target));
    }

    selected.sort(
        Comparator.comparingInt((Question question) -> codeOrder.getOrDefault(question.getTestCode(), Integer.MAX_VALUE))
            .thenComparingInt(Question::getOrderIndex)
            .thenComparing(question -> defaultCreatedAt(question.getCreatedAt())));
    return selected;
  }

  private List<Question> selectQuestionsForCode(String sourceCode, List<Question> pool, int target) {
    if (target >= pool.size()) {
      return new ArrayList<>(pool);
    }

    List<Category> categories = categoryRepository.findByTestCodeOrderByNameAsc(sourceCode);
    if (categories.isEmpty()) {
      return new ArrayList<>(pool.subList(0, target));
    }

    Map<UUID, List<Question>> questionsByCategory = new HashMap<>();
    for (Question question : pool) {
      if (question.getCategory() == null) {
        continue;
      }
      questionsByCategory.computeIfAbsent(question.getCategory().getId(), key -> new ArrayList<>()).add(question);
    }

    Map<UUID, Integer> allocation = allocateQuestionCount(categories, target);
    LinkedHashMap<UUID, Question> selected = new LinkedHashMap<>();

    for (Category category : categories) {
      List<Question> categoryQuestions = questionsByCategory.getOrDefault(category.getId(), List.of());
      int need = allocation.getOrDefault(category.getId(), 0);
      for (Question question : categoryQuestions) {
        if (need <= 0) {
          break;
        }
        selected.putIfAbsent(question.getId(), question);
        need--;
      }
    }

    if (selected.size() < target) {
      for (Question question : pool) {
        selected.putIfAbsent(question.getId(), question);
        if (selected.size() >= target) {
          break;
        }
      }
    }

    List<Question> finalList = new ArrayList<>(selected.values());
    finalList.sort(
        Comparator.comparingInt(Question::getOrderIndex)
            .thenComparing(question -> defaultCreatedAt(question.getCreatedAt())));

    if (finalList.size() > target) {
      return new ArrayList<>(finalList.subList(0, target));
    }
    return finalList;
  }

  private Map<UUID, Integer> allocateQuestionCount(List<Category> categories, int totalTarget) {
    Map<UUID, Integer> allocation = new HashMap<>();
    Map<UUID, Double> remainder = new HashMap<>();

    int assigned = 0;
    for (Category category : categories) {
      double expected = category.getWeightPercent() * totalTarget / 100.0d;
      int count = (int) Math.floor(expected);
      allocation.put(category.getId(), count);
      remainder.put(category.getId(), expected - count);
      assigned += count;
    }

    int remaining = totalTarget - assigned;
    List<Category> byRemainder = new ArrayList<>(categories);
    byRemainder.sort(
        (left, right) ->
            Double.compare(
                remainder.getOrDefault(right.getId(), 0.0d),
                remainder.getOrDefault(left.getId(), 0.0d)));

    int index = 0;
    while (remaining > 0 && !byRemainder.isEmpty()) {
      Category category = byRemainder.get(index % byRemainder.size());
      allocation.merge(category.getId(), 1, Integer::sum);
      remaining--;
      index++;
    }

    return allocation;
  }

  private Map<String, Integer> resolveRequestedTargets(TestMode mode) {
    Map<String, Object> settings = adminSettingsService.get();
    Object raw =
        settings.get(mode == TestMode.PAID ? PAID_SETTINGS_KEY : FREE_SETTINGS_KEY);
    if (!(raw instanceof Map<?, ?> rawMap)) {
      return Map.of();
    }

    Map<String, Integer> requested = new HashMap<>();
    putIfConfigured(requested, DISC_KEY, rawMap.get(DISC_KEY));
    putIfConfigured(requested, BIG_FIVE_KEY, rawMap.get(BIG_FIVE_KEY));
    putIfConfigured(requested, IKIGAI_KEY, rawMap.get(IKIGAI_KEY));
    return requested;
  }

  private void putIfConfigured(Map<String, Integer> requested, String key, Object rawValue) {
    Integer parsed = parseConfiguredTarget(rawValue);
    if (parsed != null) {
      requested.put(key, parsed);
    }
  }

  private Integer parseConfiguredTarget(Object rawValue) {
    if (rawValue == null) {
      return null;
    }

    if (rawValue instanceof Number number) {
      return Math.max(0, number.intValue());
    }

    try {
      return Math.max(0, Integer.parseInt(String.valueOf(rawValue).trim()));
    } catch (NumberFormatException ignored) {
      return null;
    }
  }

  private int resolveTargetForCode(String sourceCode, int available, Map<String, Integer> requestedTargets) {
    Integer requested = requestedTargets.get(resolveFrameworkKey(sourceCode));
    if (requested == null) {
      return available;
    }
    return Math.min(requested, available);
  }

  private String resolveFrameworkKey(String sourceCode) {
    String normalized = sourceCode == null ? "" : sourceCode.trim().toUpperCase(Locale.ROOT);
    if (normalized.startsWith("DISC")) {
      return DISC_KEY;
    }
    if ("BIG_FIVE".equals(normalized)) {
      return BIG_FIVE_KEY;
    }
    if ("IKIGAI".equals(normalized)) {
      return IKIGAI_KEY;
    }
    return normalized.toLowerCase(Locale.ROOT);
  }

  private Instant defaultCreatedAt(Instant createdAt) {
    return createdAt == null ? Instant.EPOCH : createdAt;
  }
}
