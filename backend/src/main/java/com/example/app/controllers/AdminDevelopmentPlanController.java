package com.example.app.controllers;

import com.example.app.dto.request.UpdateDevelopmentPlanRequest;
import com.example.app.dto.response.DevelopmentPlanResponse;
import com.example.app.services.AdminDevelopmentPlanService;
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
@RequestMapping("/api/admin/development-plans")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDevelopmentPlanController {

  private final AdminDevelopmentPlanService adminDevelopmentPlanService;

  @GetMapping
  public List<DevelopmentPlanResponse> list(
      @RequestParam(value = "testCode", required = false) String testCode,
      @RequestParam(value = "dimension", required = false) String dimension) {
    return adminDevelopmentPlanService.list(testCode, dimension);
  }

  @GetMapping("/{id}")
  public DevelopmentPlanResponse get(@PathVariable UUID id) {
    return adminDevelopmentPlanService.get(id);
  }

  @PostMapping
  public DevelopmentPlanResponse create(@Valid @RequestBody UpdateDevelopmentPlanRequest request) {
    return adminDevelopmentPlanService.create(request);
  }

  @PutMapping("/{id}")
  public DevelopmentPlanResponse update(@PathVariable UUID id,
      @Valid @RequestBody UpdateDevelopmentPlanRequest request) {
    return adminDevelopmentPlanService.update(id, request);
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable UUID id) {
    adminDevelopmentPlanService.delete(id);
  }
}
