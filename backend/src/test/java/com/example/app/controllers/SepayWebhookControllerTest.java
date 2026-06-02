package com.example.app.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.app.models.AppUser;
import com.example.app.models.CreditPackage;
import com.example.app.models.Order;
import com.example.app.models.OrderStatus;
import com.example.app.repositories.OrderRepository;
import com.example.app.repositories.PaymentEventRepository;
import com.example.app.services.BillingService;
import com.example.app.services.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class SepayWebhookControllerTest {

  private static final String TEST_SECRET = "test-secret-123";
  private static final ObjectMapper objectMapper = new ObjectMapper();

  private MockMvc mockMvc;
  private OrderRepository orderRepository;
  private BillingService billingService;
  private EmailService emailService;

  private UUID orderId;
  private Order testOrder;

  @BeforeEach
  void setUp() {
    orderRepository = org.mockito.Mockito.mock(OrderRepository.class);
    PaymentEventRepository paymentEventRepository = org.mockito.Mockito.mock(PaymentEventRepository.class);
    billingService = org.mockito.Mockito.mock(BillingService.class);
    emailService = org.mockito.Mockito.mock(EmailService.class);

    SepayWebhookController controller = new SepayWebhookController(
        orderRepository, paymentEventRepository, billingService, emailService, objectMapper);

    ReflectionTestUtils.setField(controller, "webhookSecret", TEST_SECRET);
    ReflectionTestUtils.setField(controller, "signatureHeader", "x-signature");

    mockMvc = MockMvcBuilders
        .standaloneSetup(controller)
        .build();

    orderId = UUID.randomUUID();
    AppUser user = new AppUser();
    user.setId(UUID.randomUUID());
    user.setEmail("user@example.com");

    CreditPackage creditPackage = new CreditPackage();
    creditPackage.setId(UUID.randomUUID());
    creditPackage.setCode("DISC_PRO");
    creditPackage.setCredits(10);
    creditPackage.setPriceVnd(199000);

    testOrder = new Order();
    testOrder.setId(orderId);
    testOrder.setUser(user);
    testOrder.setCreditPackage(creditPackage);
    testOrder.setStatus(OrderStatus.PENDING);
    testOrder.setAmountVnd(199000);
    testOrder.setCreatedAt(Instant.now());
    testOrder.setUpdatedAt(Instant.now());
  }

  private String hmacHex(String secret, String data) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
    SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes("UTF-8"), "HmacSHA256");
    mac.init(keySpec);
    byte[] raw = mac.doFinal(data.getBytes("UTF-8"));
    StringBuilder hex = new StringBuilder();
    for (byte b : raw) {
      hex.append(String.format("%02x", b));
    }
    return hex.toString();
  }

  @Test
  void webhookMissingSignatureReturns401() throws Exception {
    mockMvc.perform(post("/api/public/payments/sepay/webhook")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{}"))
        .andExpect(status().isUnauthorized())
        .andExpect(content().string("Missing signature"));
  }

  @Test
  void webhookInvalidSignatureReturns401() throws Exception {
    mockMvc.perform(post("/api/public/payments/sepay/webhook")
            .contentType(MediaType.APPLICATION_JSON)
            .header("x-signature", "invalid-sig")
            .content("{\"content\":\"test\"}"))
        .andExpect(status().isUnauthorized())
        .andExpect(content().string("Invalid signature"));
  }

  @Test
  void webhookValidSignatureCompletesOrder() throws Exception {
    when(orderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));

    String content = "TT" + orderId;
    String requestBody = objectMapper.writeValueAsString(
        new SepayWebhookRequest(1L, "VCB", "2024-01-01 12:00:00",
            "123456789", null, null, content, "in",
            "", 199000L, null, null, null, null));

    String sig = hmacHex(TEST_SECRET, requestBody);

    mockMvc.perform(post("/api/public/payments/sepay/webhook")
            .contentType(MediaType.APPLICATION_JSON)
            .header("x-signature", sig)
            .content(requestBody))
        .andExpect(status().isOk())
        .andExpect(content().string("OK"));

    verify(billingService).completeOrder(orderId);
    verify(emailService).sendPaymentSuccessEmail("user@example.com", testOrder);
  }

  @Test
  void webhookReplayDoesNotDoubleComplete() throws Exception {
    testOrder.setStatus(OrderStatus.COMPLETED);
    when(orderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));

    String content = "TT" + orderId;
    String requestBody = objectMapper.writeValueAsString(
        new SepayWebhookRequest(1L, "VCB", "2024-01-01 12:00:00",
            "123456789", null, null, content, "in",
            "", 199000L, null, null, null, null));

    String sig = hmacHex(TEST_SECRET, requestBody);

    mockMvc.perform(post("/api/public/payments/sepay/webhook")
            .contentType(MediaType.APPLICATION_JSON)
            .header("x-signature", sig)
            .content(requestBody))
        .andExpect(status().isOk())
        .andExpect(content().string("OK"));

    verify(billingService, never()).completeOrder(any());
  }

  @Test
  void webhookNoUuidInContentReturns400() throws Exception {
    String requestBody = objectMapper.writeValueAsString(
        new SepayWebhookRequest(1L, "VCB", "2024-01-01 12:00:00",
            "123456789", null, null, "NO_UUID_HERE", "in",
            "", 199000L, null, null, null, null));

    String sig = hmacHex(TEST_SECRET, requestBody);

    mockMvc.perform(post("/api/public/payments/sepay/webhook")
            .contentType(MediaType.APPLICATION_JSON)
            .header("x-signature", sig)
            .content(requestBody))
        .andExpect(status().isBadRequest())
        .andExpect(content().string("Order ID not found in content"));
  }

  @Test
  void webhookOrderNotFoundReturns404() throws Exception {
    UUID nonExistentId = UUID.randomUUID();
    when(orderRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    String content = nonExistentId.toString();
    String requestBody = objectMapper.writeValueAsString(
        new SepayWebhookRequest(1L, "VCB", "2024-01-01 12:00:00",
            "123456789", null, null, content, "in",
            "", 199000L, null, null, null, null));

    String sig = hmacHex(TEST_SECRET, requestBody);

    mockMvc.perform(post("/api/public/payments/sepay/webhook")
            .contentType(MediaType.APPLICATION_JSON)
            .header("x-signature", sig)
            .content(requestBody))
        .andExpect(status().isNotFound())
        .andExpect(content().string("Order not found"));
  }
}
