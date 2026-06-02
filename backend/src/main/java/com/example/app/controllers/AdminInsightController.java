package com.example.app.controllers;

import com.example.app.dto.request.UpdateInsightRequest;
import com.example.app.dto.response.InsightResponse;
import com.example.app.services.AdminInsightService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/insights")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminInsightController {

  private final AdminInsightService adminInsightService;

  @GetMapping
  public List<InsightResponse> list(
      @RequestParam(value = "testCode", required = false) String testCode,
      @RequestParam(value = "dimension", required = false) String dimension,
      @RequestParam(value = "category", required = false) String category) {
    return adminInsightService.list(testCode, dimension, category);
  }

  @GetMapping("/{id}")
  public InsightResponse get(@PathVariable UUID id) {
    return adminInsightService.get(id);
  }

  @PostMapping
  public InsightResponse create(@Valid @RequestBody UpdateInsightRequest request) {
    return adminInsightService.create(request);
  }

  @PutMapping("/{id}")
  public InsightResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateInsightRequest request) {
    return adminInsightService.update(id, request);
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable UUID id) {
    adminInsightService.delete(id);
  }
}
