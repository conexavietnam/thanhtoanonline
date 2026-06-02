package com.example.app.controllers;

import com.example.app.dto.request.ConsultationRequest;
import com.example.app.dto.response.ConsultationResponse;
import com.example.app.dto.response.GuideContentResponse;
import com.example.app.services.ConsultationService;
import com.example.app.services.GuideContentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicContentController {
  private final ConsultationService consultationService;
  private final GuideContentService guideContentService;

  @PostMapping("/consultations")
  public ConsultationResponse submitConsultation(@Valid @RequestBody ConsultationRequest request) {
    return consultationService.submit(request);
  }

  @GetMapping("/guide")
  public GuideContentResponse guideContent() {
    return guideContentService.getGuideContent();
  }
}
