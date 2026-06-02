package com.example.app.controllers;

import com.example.app.dto.request.AutoSaveAnswersRequest;
import com.example.app.dto.request.CreateTestSessionRequest;
import com.example.app.dto.request.SubmitTestRequest;
import com.example.app.dto.response.SaveAnswersResponse;
import com.example.app.dto.response.TestQuestionSetResponse;
import com.example.app.dto.response.TestResultResponse;
import com.example.app.dto.response.TestSessionDetailResponse;
import com.example.app.dto.response.TestSessionListItemResponse;
import com.example.app.dto.response.TestSessionResponse;
import com.example.app.services.PartnerTestService;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/partner/tests")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PARTNER','ADMIN')")
public class PartnerTestController {
  private final PartnerTestService partnerTestService;

  @PostMapping("/sessions")
  public TestSessionResponse createSession(
      Authentication authentication,
      @Valid @RequestBody CreateTestSessionRequest request) {
    return partnerTestService.createSession(authentication.getName(), request);
  }

  @GetMapping("/sessions")
  public List<TestSessionListItemResponse> listSessions(
      Authentication authentication,
      @RequestParam(value = "from", required = false) String from,
      @RequestParam(value = "to", required = false) String to,
      @RequestParam(value = "takerName", required = false) String takerName) {
    Instant fromInstant = from == null || from.isBlank() ? null : Instant.parse(from);
    Instant toInstant = to == null || to.isBlank() ? null : Instant.parse(to);
    return partnerTestService.listSessions(authentication.getName(), fromInstant, toInstant, takerName);
  }

  @GetMapping("/sessions/{sessionId}")
  public TestSessionDetailResponse sessionDetail(Authentication authentication, @PathVariable UUID sessionId) {
    return partnerTestService.getSessionDetail(authentication.getName(), sessionId);
  }

  @GetMapping("/sessions/{sessionId}/questions")
  public TestQuestionSetResponse loadQuestions(Authentication authentication, @PathVariable UUID sessionId) {
    return partnerTestService.getQuestions(authentication.getName(), sessionId);
  }

  @PostMapping("/sessions/{sessionId}/answers/autosave")
  public SaveAnswersResponse autosave(
      Authentication authentication,
      @PathVariable UUID sessionId,
      @Valid @RequestBody AutoSaveAnswersRequest request) {
    return partnerTestService.autosaveAnswers(authentication.getName(), sessionId, request);
  }

  @PostMapping("/sessions/{sessionId}/submit")
  public TestResultResponse submit(
      Authentication authentication,
      @PathVariable UUID sessionId,
      @RequestBody(required = false) SubmitTestRequest request) {
    SubmitTestRequest payload = request == null ? new SubmitTestRequest(null) : request;
    return partnerTestService.submit(authentication.getName(), sessionId, payload);
  }
}
