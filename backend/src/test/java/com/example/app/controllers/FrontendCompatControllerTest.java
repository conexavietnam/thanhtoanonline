package com.example.app.controllers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.app.dto.request.CheckoutRequest;
import com.example.app.dto.response.CheckoutResponse;
import com.example.app.dto.response.OrderResponse;
import com.example.app.models.PaymentProvider;
import com.example.app.services.BillingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class FrontendCompatControllerTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void bankTransferProviderMapsToSepayInCheckout() {
    BillingService billingService = Mockito.mock(BillingService.class);
    Authentication auth = Mockito.mock(Authentication.class);
    when(auth.getName()).thenReturn("user@example.com");

    UUID orderId = UUID.randomUUID();
    OrderResponse orderResponse = new OrderResponse(
        orderId, "DISC_PRO", 10, 199000, "SEPAY", "PENDING",
        null, Instant.now(), Instant.now(), null);

    when(billingService.createOrder(anyString(), any()))
        .thenReturn(orderResponse);
    FrontendCompatController controller = new FrontendCompatController(
        billingService, null, null);

    CheckoutRequest request = new CheckoutRequest(
        "DISC_PRO", "0912345678", "123 Main St", "BANK_TRANSFER", "test note");

    CheckoutResponse response = controller.checkout(auth, request);

    assertEquals("SEPAY", response.payment().provider());
    assertEquals(199000, response.payment().amount());
    assertNull(response.paymentUrl());
    verify(billingService, never()).createPaymentRequest(anyString(), any());
  }

  @Test
  void checkoutWithBankTransferReturnsSepayProvider() throws Exception {
    BillingService billingService = Mockito.mock(BillingService.class);

    UUID orderId = UUID.randomUUID();
    OrderResponse orderResponse = new OrderResponse(
        orderId, "DISC_PRO", 10, 199000, "SEPAY", "PENDING",
        null, Instant.now(), Instant.now(), null);

    when(billingService.createOrder(anyString(), any()))
        .thenReturn(orderResponse);
    Authentication auth = Mockito.mock(Authentication.class);
    when(auth.getName()).thenReturn("user@example.com");

    MockMvc mockMvc = MockMvcBuilders
        .standaloneSetup(new FrontendCompatController(billingService, null, null))
        .build();

    String body = objectMapper.writeValueAsString(
        new CheckoutRequest("DISC_PRO", "0912345678", "addr", "BANK_TRANSFER", "note"));

    mockMvc.perform(post("/api/payments/checkout")
            .contentType(MediaType.APPLICATION_JSON)
            .content(body)
            .principal(auth))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.payment.provider").value("SEPAY"))
        .andExpect(jsonPath("$.paymentUrl").doesNotExist());

    verify(billingService, never()).createPaymentRequest(anyString(), any());
  }
}
