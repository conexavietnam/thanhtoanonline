package com.example.app.controllers;

import com.example.app.dto.request.ExportPdfRequest;
import com.example.app.dto.response.PdfExportResponse;
import com.example.app.services.PdfExportService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/partner/exports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PARTNER','ADMIN')")
public class PartnerExportController {
  private final PdfExportService pdfExportService;

  @PostMapping
  public PdfExportResponse export(Authentication authentication, @Valid @RequestBody ExportPdfRequest request) {
    return pdfExportService.export(authentication.getName(), request);
  }

  @GetMapping
  public List<PdfExportResponse> list(Authentication authentication) {
    return pdfExportService.list(authentication.getName());
  }

  @GetMapping("/{exportId}")
  public PdfExportResponse detail(Authentication authentication, @PathVariable UUID exportId) {
    return pdfExportService.detail(authentication.getName(), exportId);
  }

  @PostMapping("/{exportId}/retry")
  public PdfExportResponse retry(Authentication authentication, @PathVariable UUID exportId) {
    return pdfExportService.retry(authentication.getName(), exportId);
  }

  @GetMapping("/{exportId}/download")
  public ResponseEntity<byte[]> download(Authentication authentication, @PathVariable UUID exportId) {
    byte[] bytes = pdfExportService.download(authentication.getName(), exportId);
    String fileName = exportId + ".pdf";
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
        .contentType(MediaType.APPLICATION_PDF)
        .contentLength(bytes.length)
        .body(bytes);
  }
}
