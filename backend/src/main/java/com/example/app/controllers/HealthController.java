package com.example.app.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

  @GetMapping("/api/health")
  public String health() {
    return "ok";
  }

  // Compatibility for container healthcheck that expects the Spring Boot actuator path
  @GetMapping("/api/actuator/health")
  public java.util.Map<String, String> actuatorHealth() {
    return java.util.Map.of("status", "UP");
  }
}
