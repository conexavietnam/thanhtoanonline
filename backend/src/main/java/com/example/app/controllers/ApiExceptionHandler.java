package com.example.app.controllers;

import com.example.app.dto.response.ApiError;
import com.example.app.utils.ApiException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiError> handleApiException(ApiException ex) {
    ApiError error = new ApiError(
        ex.getStatus().value(),
        ex.getCode(),
        ex.getMessage(),
        Instant.now(),
        null
    );
    return ResponseEntity.status(ex.getStatus()).body(error);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getFieldErrors()
        .forEach(err -> errors.put(err.getField(), err.getDefaultMessage()));

    ApiError error = new ApiError(
        HttpStatus.BAD_REQUEST.value(),
        "VALIDATION_ERROR",
        "Validation failed",
        Instant.now(),
        errors
    );
    return ResponseEntity.badRequest().body(error);
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ApiError> handleResponseStatus(ResponseStatusException ex) {
    HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
    if (status == null) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    ApiError error = new ApiError(
        status.value(),
        "ERROR",
        ex.getReason() == null ? "Request failed" : ex.getReason(),
        Instant.now(),
        null
    );
    return ResponseEntity.status(status).body(error);
  }
}
