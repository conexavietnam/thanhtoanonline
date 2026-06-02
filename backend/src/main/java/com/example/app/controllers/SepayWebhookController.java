package com.example.app.controllers;

import com.example.app.dto.request.SepayWebhookRequest;
import com.example.app.models.Order;
import com.example.app.models.OrderStatus;
import com.example.app.models.PaymentEvent;
import com.example.app.models.PaymentProvider;
import com.example.app.repositories.OrderRepository;
import com.example.app.repositories.PaymentEventRepository;
import com.example.app.services.BillingService;
import com.example.app.services.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/payments/sepay")
@RequiredArgsConstructor
public class SepayWebhookController {
  private static final Logger log = LoggerFactory.getLogger(SepayWebhookController.class);
  private static final Pattern UUID_PATTERN = Pattern.compile(
      "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

  private final OrderRepository orderRepository;
  private final PaymentEventRepository paymentEventRepository;
  private final BillingService billingService;
  private final EmailService emailService;
  private final ObjectMapper objectMapper;

  @Value("${sepay.webhook-secret:}")
  private String webhookSecret;

  @Value("${sepay.signature-header:x-signature}")
  private String signatureHeader;

  @PostMapping("/webhook")
  public ResponseEntity<String> handleWebhook(
      @RequestBody SepayWebhookRequest request,
      @RequestHeader(value = "x-signature", required = false) String xSignature,
      @RequestHeader(value = "signature", required = false) String signatureLegacy) {
    if (webhookSecret == null || webhookSecret.isBlank()) {
      log.error("SEPAY_WEBHOOK_SECRET not configured");
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Webhook not configured");
    }

    String providedSig = xSignature != null ? xSignature : signatureLegacy;
    if (providedSig == null || providedSig.isBlank()) {
      log.warn("SEPAY webhook missing signature header");
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing signature");
    }

    String payloadRaw;
    try {
      payloadRaw = objectMapper.writeValueAsString(request);
    } catch (Exception e) {
      log.error("Failed to serialize request for HMAC", e);
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payload");
    }

    String computedSig = hmacSha256(webhookSecret, payloadRaw);
    if (!providedSig.equalsIgnoreCase(computedSig)) {
      log.warn("SEPAY webhook invalid signature: provided={}, computed={}", providedSig, computedSig);
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
    }

    String content = request.content();
    if (content == null || content.isBlank()) {
      log.warn("SEPAY webhook empty content/description");
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Empty content");
    }

    Matcher matcher = UUID_PATTERN.matcher(content);
    if (!matcher.find()) {
      log.warn("SEPAY webhook no UUID in content: {}", content);
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Order ID not found in content");
    }

    UUID orderId;
    try {
      orderId = UUID.fromString(matcher.group());
    } catch (IllegalArgumentException e) {
      log.error("Invalid UUID in content: {}", content, e);
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid order ID");
    }

    Order order = orderRepository.findById(orderId).orElse(null);
    if (order == null) {
      log.warn("SEPAY webhook order not found: {}", orderId);
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found");
    }

    ObjectNode payload = objectMapper.createObjectNode();
    payload.put("sepayId", request.id() != null ? request.id() : -1);
    payload.put("gateway", request.gateway());
    payload.put("transferAmount", request.transferAmount() != null ? request.transferAmount() : 0);
    payload.put("content", request.content());
    payload.put("transactionDate", request.transactionDate());
    payload.put("accountNumber", request.accountNumber());
    payload.put("signature", providedSig);

    PaymentEvent event = new PaymentEvent();
    event.setOrder(order);
    event.setProvider(PaymentProvider.SEPAY);
    event.setEventType("SEPAY_WEBHOOK");
    event.setVerified(true);
    event.setPayload(payload);
    paymentEventRepository.save(event);

    if (order.getStatus() == OrderStatus.PENDING) {
      try {
        billingService.completeOrder(order.getId());
        log.info("SEPAY webhook completed order: {}", orderId);
        emailService.sendPaymentSuccessEmail(order.getUser().getEmail(), order);
      } catch (Exception e) {
        log.error("SEPAY webhook failed to complete order {}: {}", orderId, e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Order processing failed");
      }
    } else {
      log.info("SEPAY webhook order {} already in status {}, skipping", orderId, order.getStatus());
    }

    return ResponseEntity.ok("OK");
  }

  private String hmacSha256(String secret, String data) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes("UTF-8"), "HmacSHA256");
      mac.init(keySpec);
      byte[] rawHmac = mac.doFinal(data.getBytes("UTF-8"));
      StringBuilder hex = new StringBuilder();
      for (byte b : rawHmac) {
        hex.append(String.format("%02x", b));
      }
      return hex.toString();
    } catch (Exception e) {
      throw new RuntimeException("HMAC-SHA256 failed", e);
    }
  }
}
