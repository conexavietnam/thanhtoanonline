package com.example.app.controllers;

import com.example.app.dto.request.UpdateCareerRequest;
import com.example.app.dto.response.CareerResponse;
import com.example.app.services.AdminCareerService;
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
@RequestMapping("/api/admin/careers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCareerController {

  private final AdminCareerService adminCareerService;

  @GetMapping
  public List<CareerResponse> list(
      @RequestParam(value = "testCode", required = false) String testCode,
      @RequestParam(value = "dimension", required = false) String dimension) {
    return adminCareerService.list(testCode, dimension);
  }

  @GetMapping("/{id}")
  public CareerResponse get(@PathVariable UUID id) {
    return adminCareerService.get(id);
  }

  @PostMapping
  public CareerResponse create(@Valid @RequestBody UpdateCareerRequest request) {
    return adminCareerService.create(request);
  }

  @PutMapping("/{id}")
  public CareerResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateCareerRequest request) {
    return adminCareerService.update(id, request);
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable UUID id) {
    adminCareerService.delete(id);
  }
}
