package com.example.app.controllers;

import com.example.app.dto.request.ImportQuestionsRequest;
import com.example.app.dto.request.UpdateQuestionRequest;
import com.example.app.dto.response.AdminQuestionResponse;
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

/**
 * Thin façade exposing question CRUD/import/export directly under /api/admin/questions.
 * This keeps compatibility with the admin UI while reusing the existing catalog service
 * and supports any test code (DISC, BIG_FIVE, IKIGAI, etc.).
 */
@RestController
@RequestMapping("/api/admin/questions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminQuestionController {
  private final AdminCatalogService adminCatalogService;

  @GetMapping
  public List<AdminQuestionResponse> list(@RequestParam(value = "testCode", required = false) String testCode) {
    return adminCatalogService.listQuestions(testCode);
  }

  @PostMapping
  public AdminQuestionResponse create(@Valid @RequestBody UpdateQuestionRequest request) {
    return adminCatalogService.createQuestion(request);
  }

  @PutMapping("/{questionId}")
  public AdminQuestionResponse update(
      @PathVariable UUID questionId,
      @Valid @RequestBody UpdateQuestionRequest request) {
    return adminCatalogService.updateQuestion(questionId, request);
  }

  @DeleteMapping("/{questionId}")
  public void delete(@PathVariable UUID questionId) {
    adminCatalogService.deleteQuestion(questionId);
  }

  @GetMapping("/export")
  public ResponseEntity<byte[]> exportExcel(@RequestParam("testCode") String testCode) {
    byte[] bytes = adminCatalogService.exportQuestionsExcel(testCode);
    String fileName = "questions_" + testCode.trim().toLowerCase() + ".xlsx";

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .contentLength(bytes.length)
        .body(bytes);
  }

  @GetMapping("/export-template")
  public ResponseEntity<byte[]> exportTemplate(@RequestParam("testCode") String testCode) {
    byte[] bytes = adminCatalogService.exportQuestionsTemplateExcel(testCode);
    String fileName = "questions_template_" + testCode.trim().toLowerCase() + ".xlsx";

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .contentLength(bytes.length)
        .body(bytes);
  }

  @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ImportQuestionsResponse importExcel(@RequestParam("file") MultipartFile file) {
    return adminCatalogService.importQuestionsExcel(file);
  }

  @GetMapping("/export-csv")
  public QuestionsCsvResponse exportCsv(@RequestParam("testCode") String testCode) {
    return adminCatalogService.exportQuestionsCsv(testCode);
  }

  @PostMapping("/import-csv")
  public ImportQuestionsResponse importCsv(@Valid @RequestBody ImportQuestionsRequest request) {
    return adminCatalogService.importQuestionsCsv(request);
  }
}
