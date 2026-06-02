package com.example.app.controllers;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.app.dto.response.MessageResponse;
import com.example.app.services.AuthService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AuthControllerTest {

  @Test
  void verifyEmailEndpointDelegatesToService() throws Exception {
    AuthService authService = Mockito.mock(AuthService.class);
    when(authService.verifyEmail("raw-token")).thenReturn(new MessageResponse("Email verified"));
    MockMvc mockMvc = MockMvcBuilders
        .standaloneSetup(new AuthController(authService))
        .build();

    mockMvc.perform(get("/api/auth/verify").param("token", "raw-token"))
        .andExpect(status().isOk());

    verify(authService).verifyEmail("raw-token");
  }

  @Test
  void legacyVerifyEmailEndpointDelegatesToService() throws Exception {
    AuthService authService = Mockito.mock(AuthService.class);
    when(authService.verifyEmail("legacy-token")).thenReturn(new MessageResponse("Email verified"));
    MockMvc mockMvc = MockMvcBuilders
        .standaloneSetup(new AuthController(authService))
        .build();

    mockMvc.perform(get("/api/auth/email-verification/verify").param("token", "legacy-token"))
        .andExpect(status().isOk());

    verify(authService).verifyEmail("legacy-token");
  }
}
