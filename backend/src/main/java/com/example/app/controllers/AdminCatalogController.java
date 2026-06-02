package com.example.app.controllers;

import com.example.app.dto.request.ImportQuestionsRequest;
import com.example.app.dto.request.UpdateCategoryRequest;
import com.example.app.dto.request.UpdateQuestionRequest;
import com.example.app.dto.response.AdminCategoryResponse;
import com.example.app.dto.response.AdminQuestionResponse;
import com.example.app.dto.response.CategoryWeightValidationResponse;
import com.example.app.dto.response.ImportQuestionsResponse;
import com.example.app.dto.response.QuestionsCsvResponse;
import com.example.app.services.AdminCatalogService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/catalog")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCatalogController {
  private final AdminCatalogService adminCatalogService;

  @GetMapping("/categories")
  public List<AdminCategoryResponse> categories(@RequestParam(value = "testCode", required = false) String testCode) {
    return adminCatalogService.listCategories(testCode);
  }

  @PostMapping("/categories")
  public AdminCategoryResponse createCategory(@Valid @RequestBody UpdateCategoryRequest request) {
    return adminCatalogService.createCategory(request);
  }

  @PutMapping("/categories/{categoryId}")
  public AdminCategoryResponse updateCategory(
      @PathVariable UUID categoryId,
      @Valid @RequestBody UpdateCategoryRequest request) {
    return adminCatalogService.updateCategory(categoryId, request);
  }

  @DeleteMapping("/categories/{categoryId}")
  public void deleteCategory(@PathVariable UUID categoryId) {
    adminCatalogService.deleteCategory(categoryId);
  }

  @GetMapping("/categories/validate")
  public CategoryWeightValidationResponse validate(@RequestParam("testCode") String testCode) {
    return adminCatalogService.validateWeight(testCode);
  }

  @GetMapping("/questions")
  public List<AdminQuestionResponse> questions(@RequestParam(value = "testCode", required = false) String testCode) {
    return adminCatalogService.listQuestions(testCode);
  }

  @PostMapping("/questions")
  public AdminQuestionResponse createQuestion(@Valid @RequestBody UpdateQuestionRequest request) {
    return adminCatalogService.createQuestion(request);
  }

  @PutMapping("/questions/{questionId}")
  public AdminQuestionResponse updateQuestion(
      @PathVariable UUID questionId,
      @Valid @RequestBody UpdateQuestionRequest request) {
    return adminCatalogService.updateQuestion(questionId, request);
  }

  @DeleteMapping("/questions/{questionId}")
  public void deleteQuestion(@PathVariable UUID questionId) {
    adminCatalogService.deleteQuestion(questionId);
  }

  @GetMapping("/questions/export")
  public ResponseEntity<byte[]> exportExcel(@RequestParam("testCode") String testCode) {
    byte[] bytes = adminCatalogService.exportQuestionsExcel(testCode);
    String fileName = "questions_" + testCode.trim().toLowerCase() + ".xlsx";

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .contentLength(bytes.length)
        .body(bytes);
  }

  @PostMapping(value = "/questions/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ImportQuestionsResponse importExcel(@RequestParam("file") MultipartFile file) {
    return adminCatalogService.importQuestionsExcel(file);
  }

  @GetMapping("/questions/export-csv")
  public QuestionsCsvResponse exportCsv(@RequestParam("testCode") String testCode) {
    return adminCatalogService.exportQuestionsCsv(testCode);
  }

  @PostMapping("/questions/import-csv")
  public ImportQuestionsResponse importCsv(@Valid @RequestBody ImportQuestionsRequest request) {
    return adminCatalogService.importQuestionsCsv(request);
  }
}
