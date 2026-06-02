package com.example.app.services;

import com.example.app.utils.ApiException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {
  private static final Map<String, String> CONTENT_TYPE_EXTENSIONS = Map.of(
      "image/jpeg", ".jpg",
      "image/png", ".png",
      "image/gif", ".gif",
      "image/webp", ".webp",
      "image/svg+xml", ".svg");

  private final Path uploadDir;

  public FileStorageService(@Value("${app.upload-dir:backend/storage/uploads}") String uploadDir) {
    this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
  }

  public String store(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "FILE_REQUIRED", "No file uploaded");
    }

    String contentType = file.getContentType();
    if (!StringUtils.hasText(contentType) || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "UNSUPPORTED_FILE_TYPE", "Only image uploads are supported");
    }

    String fileName = UUID.randomUUID() + resolveExtension(file.getOriginalFilename(), contentType);
    Path target = uploadDir.resolve(fileName).normalize();
    if (!target.startsWith(uploadDir)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_FILE_NAME", "Invalid file name");
    }

    try {
      Files.createDirectories(uploadDir);
      try (InputStream inputStream = file.getInputStream()) {
        Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
      }
    } catch (IOException ex) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "FILE_UPLOAD_FAILED", "Could not store uploaded file");
    }

    return "/uploads/" + fileName;
  }

  public String getUploadResourceLocation() {
    // Quốc Trí: giữ asset upload trong backend/storage để URL /uploads ổn định giữa local và deploy.
    String location = uploadDir.toUri().toString();
    return location.endsWith("/") ? location : location + "/";
  }

  private String resolveExtension(String originalFilename, String contentType) {
    String extension = StringUtils.getFilenameExtension(originalFilename);
    if (StringUtils.hasText(extension)) {
      String normalized = extension.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
      if (!normalized.isEmpty()) {
        return "." + normalized;
      }
    }
    return CONTENT_TYPE_EXTENSIONS.getOrDefault(contentType.toLowerCase(Locale.ROOT), "");
  }
}
