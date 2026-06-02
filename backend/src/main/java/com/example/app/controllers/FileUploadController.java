package com.example.app.controllers;

import com.example.app.dto.response.FileUploadResponse;
import com.example.app.services.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class FileUploadController {
  private final FileStorageService fileStorageService;

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public FileUploadResponse upload(@RequestParam("file") MultipartFile file) {
    return new FileUploadResponse(fileStorageService.store(file));
  }
}
