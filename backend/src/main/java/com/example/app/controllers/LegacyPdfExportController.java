package com.example.app.controllers;

import com.example.app.dto.request.LegacyPdfExportRecordRequest;
import com.example.app.dto.request.LegacyPdfPreviewRequest;
import com.example.app.dto.response.LegacyPdfExportCheckResponse;
import com.example.app.dto.response.MessageResponse;
import com.example.app.services.LegacyPdfExportCompatService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pdf-exports")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class LegacyPdfExportController {
  private final LegacyPdfExportCompatService legacyPdfExportCompatService;

  @GetMapping("/check")
  public LegacyPdfExportCheckResponse check(
      Authentication authentication,
      @RequestParam(required = false) UUID testSessionId) {
    return legacyPdfExportCompatService.check(authentication.getName(), testSessionId);
  }

  @PostMapping("/record")
  public MessageResponse record(@Valid @RequestBody(required = false) LegacyPdfExportRecordRequest request) {
    return new MessageResponse("Recorded");
  }

  @PostMapping("/record-view")
  public ResponseEntity<Void> recordView(@RequestParam UUID testSessionId) {
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/record-click-pay")
  public ResponseEntity<Void> recordClickPay(@RequestParam UUID testSessionId) {
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/download")
  public ResponseEntity<byte[]> download(
      Authentication authentication,
      @RequestParam UUID testSessionId) {
    byte[] bytes = legacyPdfExportCompatService.download(authentication.getName(), testSessionId);
    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_PDF)
        .contentLength(bytes.length)
        .body(bytes);
  }

  @PostMapping("/preview-config")
  public ResponseEntity<byte[]> previewConfig(@RequestBody(required = false) LegacyPdfPreviewRequest request) {
    byte[] bytes = legacyPdfExportCompatService.preview(request);
    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_PDF)
        .contentLength(bytes.length)
        .body(bytes);
  }
}
