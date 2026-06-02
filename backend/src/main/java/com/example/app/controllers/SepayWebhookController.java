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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.util.StringUtils;

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

  @Value("${sepay.signature-header:x-sepay-signature}")
  private String signatureHeader;

  @PostMapping("/webhook")
  public ResponseEntity<String> handleWebhook(
      @RequestBody String rawBody,
      @RequestHeader java.util.Map<String, String> headers) {
    if (webhookSecret == null || webhookSecret.isBlank()) {
      log.error("SEPAY_WEBHOOK_SECRET not configured");
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Webhook not configured");
    }

    String providedSig = resolveSignature(headers);
    if (providedSig == null || providedSig.isBlank()) {
      log.warn("SEPAY webhook missing signature header");
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing signature");
    }

    String timestamp = resolveTimestamp(headers);
    if (!StringUtils.hasText(timestamp)) {
      log.warn("SEPAY webhook missing timestamp header");
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing timestamp");
    }

    SepayWebhookRequest request;
    JsonNode rawPayload;
    try {
      rawPayload = objectMapper.readTree(rawBody);
      request = objectMapper.treeToValue(rawPayload, SepayWebhookRequest.class);
    } catch (Exception e) {
      log.error("Failed to parse SEPAY webhook payload", e);
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payload");
    }

    String signedPayload = timestamp + "." + rawBody;
    String computedSig = "sha256=" + hmacSha256(webhookSecret, signedPayload);
    if (!secureEquals(normalizeSignature(providedSig), computedSig)) {
      log.warn("SEPAY webhook invalid signature");
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
    }

    String referenceText = firstText(
        request.code(),
        request.content(),
        request.description(),
        request.rawData() != null ? request.rawData().toString() : null);
    if (referenceText == null || referenceText.isBlank()) {
      log.warn("SEPAY webhook empty reference text");
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Empty content");
    }

    if (StringUtils.hasText(request.transferType()) && !"in".equalsIgnoreCase(request.transferType().trim())) {
      log.info("SEPAY webhook ignored non-incoming transfer type={}", request.transferType());
      return ResponseEntity.ok("Ignored");
    }

    Order order = resolveOrder(request.code(), request.content(), request.description(), request.rawData(), request.transferAmount());
    if (order == null) {
      log.warn("SEPAY webhook order not found for reference={} amount={}",
          referenceText, request.transferAmount());
      return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found");
    }
    UUID orderId = order.getId();

    if (request.transferAmount() != null && request.transferAmount() < order.getAmountVnd()) {
      log.warn("SEPAY webhook amount mismatch order={} expected={} actual={}",
          orderId, order.getAmountVnd(), request.transferAmount());
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Amount mismatch");
    }

    ObjectNode payload = objectMapper.createObjectNode();
    payload.set("raw", rawPayload);
    payload.put("sepayId", request.id() != null ? request.id() : -1);
    payload.put("gateway", request.gateway());
    payload.put("transferAmount", request.transferAmount() != null ? request.transferAmount() : 0);
    payload.put("content", request.content());
    payload.put("description", request.description());
    payload.put("code", request.code());
    payload.put("transferType", request.transferType());
    payload.put("transactionDate", request.transactionDate());
    payload.put("accountNumber", request.accountNumber());

    if (request.id() != null) {
      order.setExternalTxnId(String.valueOf(request.id()));
    }
    order.setExternalPayload(payload);
    orderRepository.save(order);

    PaymentEvent event = new PaymentEvent();
    event.setOrder(order);
    event.setProvider(PaymentProvider.SEPAY);
    event.setEventType("SEPAY_WEBHOOK");
    event.setVerified(true);
    event.setPayload(payload);
    paymentEventRepository.save(event);

    if (order.getStatus() == OrderStatus.PENDING) {
      Order completedOrder;
      try {
        completedOrder = billingService.completeOrder(order.getId());
        log.info("SEPAY webhook completed order: {}", orderId);
      } catch (Exception e) {
        log.error("SEPAY webhook failed to complete order {}: {}", orderId, e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Order processing failed");
      }

      try {
        if (completedOrder == null) {
          completedOrder = order;
        }
        emailService.sendPaymentSuccessEmail(completedOrder.getUser().getEmail(), completedOrder);
      } catch (Exception e) {
        log.error("SEPAY webhook payment email failed for order {}: {}", orderId, e.getMessage(), e);
      }
    } else {
      log.info("SEPAY webhook order {} already in status {}, skipping", orderId, order.getStatus());
    }

    return ResponseEntity.ok("OK");
  }

  private String resolveTimestamp(java.util.Map<String, String> headers) {
    String timestamp = headerValue(headers, "x-sepay-timestamp");
    if (StringUtils.hasText(timestamp)) {
      return timestamp;
    }
    return headerValue(headers, "sepay-timestamp");
  }

  private String resolveSignature(java.util.Map<String, String> headers) {
    if (headers == null || headers.isEmpty()) {
      return null;
    }
    String configured = headerValue(headers, signatureHeader);
    if (StringUtils.hasText(configured)) {
      return configured;
    }
    String xSignature = headerValue(headers, "x-signature");
    if (StringUtils.hasText(xSignature)) {
      return xSignature;
    }
    String sepaySignature = headerValue(headers, "x-sepay-signature");
    if (StringUtils.hasText(sepaySignature)) {
      return sepaySignature;
    }
    return headerValue(headers, "signature");
  }

  private Order resolveOrder(String code, String content, String description, JsonNode rawData, Long transferAmount) {
    Order orderByUuid = resolveOrderByUuid(code, content, description, rawData);
    if (orderByUuid != null) {
      return orderByUuid;
    }

    if (transferAmount == null) {
      log.warn("SEPAY webhook missing amount for fallback order resolution");
      return null;
    }

    long normalizedTransferAmount = transferAmount.longValue();
    List<Order> pendingOrders = orderRepository.findByStatusOrderByCreatedAtDesc(OrderStatus.PENDING);
    List<Order> candidates = pendingOrders.stream()
        .filter(order -> order.getAmountVnd() == normalizedTransferAmount)
        .toList();

    if (candidates.size() == 1) {
      return candidates.get(0);
    }

    if (candidates.isEmpty() && pendingOrders.size() == 1) {
      return pendingOrders.get(0);
    }

    if (candidates.isEmpty()) {
      return null;
    }

    log.warn("SEPAY webhook ambiguous fallback candidates amount={} count={}",
        transferAmount, candidates.size());
    return null;
  }

  private Order resolveOrderByUuid(String code, String content, String description, JsonNode rawData) {
    for (String referenceText : new String[] {
        code,
        content,
        description,
        rawData == null ? null : rawData.toString()}) {
      if (!StringUtils.hasText(referenceText)) {
        continue;
      }

      Matcher matcher = UUID_PATTERN.matcher(referenceText);
      while (matcher.find()) {
        String candidate = matcher.group();
        try {
          UUID orderId = UUID.fromString(candidate);
          Order order = orderRepository.findById(orderId).orElse(null);
          if (order != null) {
            return order;
          }
        } catch (IllegalArgumentException e) {
          log.warn("SEPAY webhook found invalid UUID in reference text: {}", candidate);
        }
      }
    }

    return null;
  }

  private String firstText(String... values) {
    if (values == null) {
      return null;
    }
    for (String value : values) {
      if (StringUtils.hasText(value)) {
        return value;
      }
    }
    return null;
  }

  private String headerValue(java.util.Map<String, String> headers, String name) {
    if (!StringUtils.hasText(name)) {
      return null;
    }
    for (java.util.Map.Entry<String, String> entry : headers.entrySet()) {
      if (name.equalsIgnoreCase(entry.getKey())) {
        return entry.getValue();
      }
    }
    return null;
  }

  private String normalizeSignature(String signature) {
    String cleaned = signature == null ? "" : signature.trim();
    if (cleaned.regionMatches(true, 0, "sha256=", 0, 7)) {
      return "sha256=" + cleaned.substring(7);
    }
    return "sha256=" + cleaned;
  }

  private boolean secureEquals(String a, String b) {
    return MessageDigest.isEqual(
        a.getBytes(StandardCharsets.UTF_8),
        b.getBytes(StandardCharsets.UTF_8));
  }

  private String hmacSha256(String secret, String data) {
    try {
      Mac mac = Mac.getInstance("HmacSHA256");
      SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
      mac.init(keySpec);
      byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
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
