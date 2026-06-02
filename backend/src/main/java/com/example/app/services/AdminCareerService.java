package com.example.app.services;

import com.example.app.dto.request.UpdateCareerRequest;
import com.example.app.dto.response.CareerResponse;
import com.example.app.models.Career;
import com.example.app.repositories.CareerRepository;
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
public class AdminCareerService {

  private final CareerRepository careerRepository;

  public List<CareerResponse> list(String testCode, String dimension) {
    String normalizedTestCode = testCode == null ? null : testCode.trim().toUpperCase(Locale.ROOT);
    String normalizedDimension = normalize(dimension);
    if (normalizedDimension != null) {
      normalizedDimension = normalizedDimension.toLowerCase();
    }
    List<Career> careers = careerRepository.search(normalizedTestCode, normalizedDimension);
    return careers.stream().map(this::toResponse).collect(Collectors.toList());
  }

  public CareerResponse get(UUID id) {
    Career career = careerRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CAREER_NOT_FOUND", "Career not found"));
    return toResponse(career);
  }

  @Transactional
  public CareerResponse create(UpdateCareerRequest request) {
    Career career = new Career();
    apply(career, request);
    return toResponse(careerRepository.save(career));
  }

  @Transactional
  public CareerResponse update(UUID id, UpdateCareerRequest request) {
    Career career = careerRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CAREER_NOT_FOUND", "Career not found"));
    apply(career, request);
    return toResponse(careerRepository.save(career));
  }

  @Transactional
  public void delete(UUID id) {
    if (!careerRepository.existsById(id)) {
      throw new ApiException(HttpStatus.NOT_FOUND, "CAREER_NOT_FOUND", "Career not found");
    }
    careerRepository.deleteById(id);
  }

  private void apply(Career career, UpdateCareerRequest request) {
    career.setTestCode(request.testCode() != null ? request.testCode().trim().toUpperCase(Locale.ROOT) : "DISC");
    career.setPrimaryDimension(normalize(request.primaryDimension()));
    career.setSecondaryDimension(normalize(request.secondaryDimension()));
    career.setJobTitle(request.jobTitle().trim());
    career.setMatchLevel(request.matchLevel());
    career.setSummary(trim(request.summary()));
    career.setSkills(trim(request.skills()));
    career.setLearningResources(trim(request.learningResources()));
    career.setActive(request.active() == null || request.active());
    career.setAllowedPlanCodes(request.allowedPlanCodes() == null ? List.of() : request.allowedPlanCodes());
  }

  private CareerResponse toResponse(Career career) {
    return new CareerResponse(
        career.getId(),
        career.getTestCode(),
        career.getPrimaryDimension(),
        career.getSecondaryDimension(),
        career.getJobTitle(),
        career.getMatchLevel(),
        career.getSummary(),
        career.getSkills(),
        career.getLearningResources(),
        career.isActive(),
        career.getAllowedPlanCodes());
  }

  private String normalize(String value) {
    return value == null ? null : value.trim();
  }

  private String trim(String value) {
    return value == null ? null : value.trim();
  }
}
