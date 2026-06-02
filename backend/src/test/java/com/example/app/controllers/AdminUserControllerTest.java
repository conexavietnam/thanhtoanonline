package com.example.app.controllers;

import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.app.services.AdminUserService;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AdminUserControllerTest {

  @Test
  void deleteUserEndpointDelegatesToService() throws Exception {
    AdminUserService adminUserService = Mockito.mock(AdminUserService.class);
    MockMvc mockMvc = MockMvcBuilders
        .standaloneSetup(new AdminUserController(adminUserService))
        .build();

    UUID userId = UUID.randomUUID();

    mockMvc.perform(delete("/api/admin/users/{userId}", userId))
        .andExpect(status().isOk());

    verify(adminUserService).deleteUser(userId);
  }
}
