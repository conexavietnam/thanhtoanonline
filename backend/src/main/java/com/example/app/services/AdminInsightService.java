package com.example.app.services;

import com.example.app.dto.request.UpdateInsightRequest;
import com.example.app.dto.response.InsightResponse;
import com.example.app.models.Insight;
import com.example.app.repositories.InsightRepository;
import com.example.app.utils.ApiException;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminInsightService {

  private final InsightRepository insightRepository;

  public List<InsightResponse> list(String testCode, String dimension, String category) {
    String normalizedTestCode = testCode == null ? null : testCode.trim().toUpperCase(Locale.ROOT);
    String normalizedDimension = normalize(dimension);
    String normalizedCategory = normalize(category);
    if (normalizedDimension != null)
      normalizedDimension = normalizedDimension.toLowerCase(Locale.ROOT);
    if (normalizedCategory != null)
      normalizedCategory = normalizedCategory.toLowerCase(Locale.ROOT);
    List<Insight> entities = insightRepository.search(
        normalizedTestCode,
        normalizedDimension,
        normalizedCategory);
    return entities.stream().map(this::toResponse).collect(Collectors.toList());
  }

  public InsightResponse get(UUID id) {
    Insight insight = insightRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INSIGHT_NOT_FOUND", "Insight not found"));
    return toResponse(insight);
  }

  @Transactional
  public InsightResponse create(UpdateInsightRequest request) {
    Insight insight = new Insight();
    apply(insight, request);
    return toResponse(insightRepository.save(insight));
  }

  @Transactional
  public InsightResponse update(UUID id, UpdateInsightRequest request) {
    Insight insight = insightRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INSIGHT_NOT_FOUND", "Insight not found"));
    apply(insight, request);
    return toResponse(insightRepository.save(insight));
  }

  @Transactional
  public void delete(UUID id) {
    if (!insightRepository.existsById(id)) {
      throw new ApiException(HttpStatus.NOT_FOUND, "INSIGHT_NOT_FOUND", "Insight not found");
    }
    insightRepository.deleteById(id);
  }

  private void apply(Insight insight, UpdateInsightRequest request) {
    insight.setTestCode(request.testCode() != null ? request.testCode().trim().toUpperCase(Locale.ROOT) : "DISC");
    insight.setCategory(normalize(request.category()));
    insight.setDimension(normalize(request.dimension()));
    insight.setSummary(trim(request.summary()));
    insight.setKeyBehaviors(trim(request.keyBehaviors()));
    insight.setStrengths(trim(request.strengths()));
    insight.setWeaknesses(trim(request.weaknesses()));
    insight.setCommunicationStyle(trim(request.communicationStyle()));
    insight.setLeadershipStyle(trim(request.leadershipStyle()));
    insight.setActive(request.active() == null || request.active());
    insight.setAllowedPlanCodes(request.allowedPlanCodes() == null ? List.of() : request.allowedPlanCodes());
  }

  private InsightResponse toResponse(Insight insight) {
    return new InsightResponse(
        insight.getId(),
        insight.getTestCode(),
        insight.getCategory(),
        insight.getDimension(),
        insight.getSummary(),
        insight.getKeyBehaviors(),
        insight.getStrengths(),
        insight.getWeaknesses(),
        insight.getCommunicationStyle(),
        insight.getLeadershipStyle(),
        insight.isActive(),
        insight.getAllowedPlanCodes());
  }

  private String normalize(String value) {
    return value == null ? null : value.trim();
  }

  private String trim(String value) {
    return value == null ? null : value.trim();
  }
}
