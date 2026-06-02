package com.example.app.services;

import com.example.app.dto.request.UpdateDevelopmentPlanRequest;
import com.example.app.dto.response.DevelopmentPlanResponse;
import com.example.app.models.DevelopmentPlan;
import com.example.app.repositories.DevelopmentPlanRepository;
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
public class AdminDevelopmentPlanService {

  private final DevelopmentPlanRepository developmentPlanRepository;

  public List<DevelopmentPlanResponse> list(String testCode, String dimension) {
    String normalizedTestCode = testCode == null ? null : testCode.trim().toUpperCase(Locale.ROOT);
    List<DevelopmentPlan> plans = developmentPlanRepository.search(normalizedTestCode, normalize(dimension));
    return plans.stream().map(this::toResponse).collect(Collectors.toList());
  }

  public DevelopmentPlanResponse get(UUID id) {
    DevelopmentPlan plan = developmentPlanRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "DEV_PLAN_NOT_FOUND", "Development plan not found"));
    return toResponse(plan);
  }

  @Transactional
  public DevelopmentPlanResponse create(UpdateDevelopmentPlanRequest request) {
    DevelopmentPlan plan = new DevelopmentPlan();
    apply(plan, request);
    return toResponse(developmentPlanRepository.save(plan));
  }

  @Transactional
  public DevelopmentPlanResponse update(UUID id, UpdateDevelopmentPlanRequest request) {
    DevelopmentPlan plan = developmentPlanRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "DEV_PLAN_NOT_FOUND", "Development plan not found"));
    apply(plan, request);
    return toResponse(developmentPlanRepository.save(plan));
  }

  @Transactional
  public void delete(UUID id) {
    if (!developmentPlanRepository.existsById(id)) {
      throw new ApiException(HttpStatus.NOT_FOUND, "DEV_PLAN_NOT_FOUND", "Development plan not found");
    }
    developmentPlanRepository.deleteById(id);
  }

  private void apply(DevelopmentPlan plan, UpdateDevelopmentPlanRequest request) {
    plan.setTestCode(request.testCode() != null ? request.testCode().trim().toUpperCase(Locale.ROOT) : "DISC");
    plan.setDimension(normalize(request.dimension()));
    plan.setFocusArea(trim(request.focusArea()));
    plan.setTimeline(trim(request.timeline()));
    plan.setObjectives(trim(request.objectives()));
    plan.setActions(trim(request.actions()));
    plan.setResources(trim(request.resources()));
    plan.setActive(request.active() == null || request.active());
    plan.setAllowedPlanCodes(request.allowedPlanCodes() == null ? List.of() : request.allowedPlanCodes());
  }

  private DevelopmentPlanResponse toResponse(DevelopmentPlan plan) {
    return new DevelopmentPlanResponse(
        plan.getId(),
        plan.getTestCode(),
        plan.getDimension(),
        plan.getFocusArea(),
        plan.getTimeline(),
        plan.getObjectives(),
        plan.getActions(),
        plan.getResources(),
        plan.isActive(),
        plan.getAllowedPlanCodes());
  }

  private String normalize(String value) {
    return value == null ? null : value.trim().toLowerCase();
  }

  private String trim(String value) {
    return value == null ? null : value.trim();
  }
}
