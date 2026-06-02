package com.example.app.services;

import com.example.app.dto.request.AdminPlanRequest;
import com.example.app.dto.request.CreateOrderRequest;
import com.example.app.dto.request.CreatePaymentRequest;
import com.example.app.dto.request.PaymentCallbackRequest;
import com.example.app.dto.response.CreditPackageResponse;
import com.example.app.dto.response.CreditTransactionResponse;
import com.example.app.dto.response.OrderResponse;
import com.example.app.dto.response.PaymentRequestResponse;
import com.example.app.models.AppUser;
import com.example.app.models.CreditPackage;
import com.example.app.models.CreditTransaction;
import com.example.app.models.CreditTxType;
import com.example.app.models.Order;
import com.example.app.models.OrderStatus;
import com.example.app.models.PaymentEvent;
import com.example.app.repositories.AppUserRepository;
import com.example.app.repositories.CreditPackageRepository;
import com.example.app.repositories.CreditTransactionRepository;
import com.example.app.repositories.OrderRepository;
import com.example.app.repositories.PaymentEventRepository;
import com.example.app.utils.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class BillingService {
  private final UserAccountService userAccountService;
  private final AppUserRepository appUserRepository;
  private final CreditPackageRepository creditPackageRepository;
  private final OrderRepository orderRepository;
  private final PaymentEventRepository paymentEventRepository;
  private final CreditTransactionRepository creditTransactionRepository;
  private final AffiliateService affiliateService;
  private final ObjectMapper objectMapper;

  public List<CreditPackageResponse> listPackages() {
    return listPackages(null);
  }

  public List<CreditPackageResponse> listPackages(String planType) {
    return creditPackageRepository.findByIsActiveTrueOrderByPriceVndAsc().stream()
        .filter(pkg -> matchesPlanType(pkg, planType))
        .map(this::toCreditPackageResponse)
        .toList();
  }

  public List<CreditPackageResponse> listAllPackages() {
    return listAllPackages(null, false);
  }

  public List<CreditPackageResponse> listAllPackages(String planType) {
    return listAllPackages(planType, false);
  }

  public List<CreditPackageResponse> listAllPackages(String planType, boolean includeInactive) {
    return (includeInactive ? creditPackageRepository.findAll()
        : creditPackageRepository.findByIsActiveTrueOrderByPriceVndAsc())
        .stream()
        .filter(pkg -> matchesPlanType(pkg, planType))
        .map(this::toCreditPackageResponse)
        .toList();
  }

  @Transactional
  public CreditPackageResponse createPackage(AdminPlanRequest request) {
    if (creditPackageRepository.findByCode(request.getCode().trim().toUpperCase(Locale.ROOT)).isPresent()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "PACKAGE_EXISTS", "Gói với mã này đã tồn tại");
    }

    CreditPackage pkg = new CreditPackage();
    mapRequestToPackage(request, pkg);

    pkg = creditPackageRepository.save(pkg);
    return toCreditPackageResponse(pkg);
  }

  @Transactional
  public CreditPackageResponse updatePackage(UUID id, AdminPlanRequest request) {
    CreditPackage pkg = creditPackageRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PACKAGE_NOT_FOUND", "Gói không tồn tại"));

    String newCode = request.getCode().trim().toUpperCase(Locale.ROOT);
    if (!pkg.getCode().equals(newCode) && creditPackageRepository.findByCode(newCode).isPresent()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "PACKAGE_EXISTS", "Trùng mã gói khác");
    }

    mapRequestToPackage(request, pkg);

    pkg = creditPackageRepository.save(pkg);
    return toCreditPackageResponse(pkg);
  }

  @Transactional
  public void deletePackage(UUID id) {
    CreditPackage pkg = creditPackageRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "PACKAGE_NOT_FOUND", "Gói không tồn tại"));

    // If no orders reference this package, hard delete.
    if (!orderRepository.existsByCreditPackageId(id)) {
      creditPackageRepository.delete(pkg);
      return;
    }

    // Otherwise, soft delete + hide from all listings:
    pkg.setActive(false);
    pkg.setHighlighted(false);

    // Free up the unique code so a replacement plan can reuse the original code.
    String originalCode = pkg.getCode() == null ? "" : pkg.getCode();
    String tombstone = "-DEL-" + id.toString().substring(0, 8);
    String newCode = (originalCode + tombstone);
    if (newCode.length() > 50) {
      newCode = newCode.substring(0, 50);
    }
    pkg.setCode(newCode);

    creditPackageRepository.save(pkg);
  }

  @Transactional
  public OrderResponse createOrder(String email, CreateOrderRequest request) {
    AppUser user = userAccountService.requireByEmail(email);
    String normalizedPackageCode = request.packageCode().trim().toUpperCase(Locale.ROOT);
    String normalizedNote = normalizeText(request.note());

    CreditPackage creditPackage = creditPackageRepository
        .findByCode(normalizedPackageCode)
        .filter(CreditPackage::isActive)
        .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "PACKAGE_NOT_FOUND", "Package not found"));

    if (isFreePackage(creditPackage)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "FREE_DISABLED", "Free package has been removed");
    }

    // Quốc Trí: tái sử dụng pending order gần nhất để chặn checkout bấm lặp tạo nhiều dòng ở admin/finance.
    Order reusableOrder = orderRepository
        .findFirstByUserIdAndCreditPackageIdAndProviderAndStatusOrderByCreatedAtDesc(
            user.getId(),
            creditPackage.getId(),
            request.provider(),
            OrderStatus.PENDING)
        .filter(existing -> existing.getAmountVnd() == creditPackage.getPriceVnd())
        .orElse(null);

    if (reusableOrder != null) {
      reusableOrder.setNote(normalizedNote);
      return toOrderResponse(orderRepository.save(reusableOrder));
    }

    Order order = new Order();
    order.setUser(user);
    order.setCreditPackage(creditPackage);
    order.setProvider(request.provider());
    order.setStatus(OrderStatus.PENDING);
    order.setAmountVnd(creditPackage.getPriceVnd());
    order.setNote(normalizedNote);

    return toOrderResponse(orderRepository.save(order));
  }

  public PaymentRequestResponse createPaymentRequest(String email, CreatePaymentRequest request) {
    AppUser user = userAccountService.requireByEmail(email);
    Order order = orderRepository.findByIdAndUserId(request.orderId(), user.getId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));

    if (order.getStatus() != OrderStatus.PENDING) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "ORDER_NOT_PENDING", "Order is not pending");
    }

    return new PaymentRequestResponse(
        order.getId(),
        order.getProvider().name(),
        null,
        "Payment request created");
  }

  @Transactional
  public OrderResponse paymentCallback(PaymentCallbackRequest request) {
    Order order = orderRepository.findById(request.orderId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));

    PaymentEvent event = new PaymentEvent();
    event.setOrder(order);
    event.setProvider(request.provider());
    event.setEventType(request.eventType());
    event.setVerified(request.verified());
    event.setPayload(request.payload() == null ? objectMapper.createObjectNode() : request.payload());
    paymentEventRepository.save(event);

    if (request.externalTxnId() != null && !request.externalTxnId().isBlank()) {
      order.setExternalTxnId(request.externalTxnId().trim());
    }
    if (request.payload() != null) {
      order.setExternalPayload(request.payload());
    }

    if (request.verified()) {
      completeOrder(order);
    } else if (order.getStatus() == OrderStatus.PENDING) {
      order.setStatus(OrderStatus.FAILED);
      orderRepository.save(order);
    }

    return toOrderResponse(order);
  }

  @Transactional
  public Order completeOrder(UUID orderId) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));
    completeOrder(order);
    return order;
  }

  @Transactional
  public OrderResponse markOrderStatus(UUID orderId, OrderStatus status, String note) {
    Order order = orderRepository.findById(orderId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));

    OrderStatus previousStatus = order.getStatus();

    if (note != null && !note.isBlank()) {
      order.setNote(note.trim());
    }

    // When an admin marks the order as COMPLETED, also grant credits to the user.
    if (status == OrderStatus.COMPLETED) {
      completeOrder(order);
      return toOrderResponse(order);
    }

    order.setStatus(status);

    if (status == OrderStatus.REFUNDED && previousStatus == OrderStatus.COMPLETED) {
      AppUser user = order.getUser();
      int maxDeduct = Math.min(order.getCreditPackage().getCredits(), user.getPdfCredits());
      user.setPdfCredits(user.getPdfCredits() - maxDeduct);
      appUserRepository.save(user);

      CreditTransaction tx = new CreditTransaction();
      tx.setUser(user);
      tx.setType(CreditTxType.REFUND);
      tx.setDelta(-maxDeduct);
      tx.setCreditsAfter(user.getPdfCredits());
      tx.setAmountVnd(order.getAmountVnd());
      tx.setRefType("ORDER");
      tx.setRefId(order.getId());
      tx.setNote("Refund order");
      creditTransactionRepository.save(tx);
    }

    return toOrderResponse(orderRepository.save(order));
  }

  public List<OrderResponse> listOrders(String email) {
    AppUser user = userAccountService.requireByEmail(email);
    return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
        .map(this::toOrderResponse)
        .toList();
  }

  public List<CreditTransactionResponse> listCreditTransactions(String email) {
    AppUser user = userAccountService.requireByEmail(email);
    return creditTransactionRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
        .map(tx -> new CreditTransactionResponse(
            tx.getCreatedAt(),
            tx.getType().name(),
            tx.getDelta(),
            tx.getCreditsAfter(),
            tx.getAmountVnd(),
            tx.getRefType(),
            tx.getRefId(),
            tx.getNote()))
        .toList();
  }

  public List<OrderResponse> listAllOrders(OrderStatus status) {
    if (status == null) {
      return orderRepository.findTop300ByOrderByCreatedAtDesc().stream().map(this::toOrderResponse).toList();
    }
    return orderRepository.findTop300ByStatusOrderByCreatedAtDesc(status).stream().map(this::toOrderResponse).toList();
  }

  private void completeOrder(Order order) {
    boolean hasPurchaseTx = creditTransactionRepository
        .existsByRefTypeAndRefIdAndType("ORDER", order.getId(), CreditTxType.PURCHASE);

    // Always ensure status is completed, even if credits were already granted.
    order.setStatus(OrderStatus.COMPLETED);
    orderRepository.save(order);

    if (!hasPurchaseTx) {
      AppUser user = order.getUser();
      int creditsToAdd = order.getCreditPackage().getCredits();
      user.setPdfCredits(user.getPdfCredits() + creditsToAdd);
      appUserRepository.save(user);

      CreditTransaction tx = new CreditTransaction();
      tx.setUser(user);
      tx.setType(CreditTxType.PURCHASE);
      tx.setDelta(creditsToAdd);
      tx.setCreditsAfter(user.getPdfCredits());
      tx.setAmountVnd(order.getAmountVnd());
      tx.setRefType("ORDER");
      tx.setRefId(order.getId());
      tx.setNote("Purchase package " + order.getCreditPackage().getCode());
      creditTransactionRepository.save(tx);
    }

    affiliateService.handleCompletedOrder(order);
  }

  private OrderResponse toOrderResponse(Order order) {
    return new OrderResponse(
        order.getId(),
        order.getCreditPackage().getCode(),
        order.getCreditPackage().getCredits(),
        order.getAmountVnd(),
        order.getProvider().name(),
        order.getStatus().name(),
        order.getExternalTxnId(),
        order.getCreatedAt(),
        order.getUpdatedAt(),
        order.getNote());
  }

  public ObjectNode paymentPayloadTemplate(UUID orderId, String message) {
    ObjectNode payload = objectMapper.createObjectNode();
    payload.put("orderId", String.valueOf(orderId));
    payload.put("message", message);
    return payload;
  }

  private String normalizeText(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }

  private boolean isFreePackage(CreditPackage pkg) {
    return pkg != null
        && (pkg.getPriceVnd() <= 0 || "FREE".equalsIgnoreCase(pkg.getCode()));
  }

  private CreditPackageResponse toCreditPackageResponse(CreditPackage pkg) {
    List<String> features = new ArrayList<>();
    if (pkg.getFeatures() != null && pkg.getFeatures().isArray()) {
      pkg.getFeatures().forEach(node -> features.add(node.asText()));
    }
    List<String> featureOptions = new ArrayList<>();
    if (pkg.getFeatureOptions() != null && pkg.getFeatureOptions().isArray()) {
      pkg.getFeatureOptions().forEach(node -> featureOptions.add(node.asText()));
    }

    String partnerName = null;
    if (pkg.getPartnerId() != null) {
      partnerName = appUserRepository.findById(pkg.getPartnerId()).map(AppUser::getFullName).orElse(null);
    }

    return CreditPackageResponse.builder()
        .id(pkg.getId())
        .planType(isPartnerPlan(pkg) ? "PARTNER_PLAN" : "USER_PLAN")
        .code(pkg.getCode())
        .name(pkg.getName())
        .price(pkg.getPriceVnd())
        .currency("VND")
        .billingCycle(pkg.getBillingCycle())
        .description(pkg.getDescription())
        .features(features)
        .featureOptions(featureOptions)
        .active(pkg.isActive())
        .highlighted(pkg.isHighlighted())
        .pdfExportLimit(pkg.getCredits())
        .partnerId(pkg.getPartnerId())
        .partnerName(partnerName)
        .build();
  }

  private void mapRequestToPackage(AdminPlanRequest request, CreditPackage pkg) {
    pkg.setCode(request.getCode().trim().toUpperCase(Locale.ROOT));
    pkg.setName(normalizeText(request.getName()));
    pkg.setDescription(normalizeText(request.getDescription()));
    pkg.setBillingCycle(request.getBillingCycle() != null ? request.getBillingCycle() : "ONE_TIME");

    if (request.getFeatures() != null) {
      pkg.setFeatures(objectMapper.valueToTree(request.getFeatures()));
    } else {
      pkg.setFeatures(objectMapper.createArrayNode());
    }

    if (request.getFeatureOptions() != null) {
      pkg.setFeatureOptions(objectMapper.valueToTree(request.getFeatureOptions()));
    } else {
      pkg.setFeatureOptions(objectMapper.createArrayNode());
    }

    pkg.setHighlighted(request.isHighlighted());
    pkg.setPartnerId(request.getPartnerId());

    int credits = request.getPdfExportLimit() != null ? request.getPdfExportLimit() : 1;
    if (credits <= 0)
      credits = 1; // Prevent CHECK constraint violation (credits > 0)
    pkg.setCredits(credits);
    pkg.setPriceVnd(request.getPrice());
    pkg.setActive(request.isActive());
  }

  private boolean matchesPlanType(CreditPackage pkg, String planType) {
    if (!StringUtils.hasText(planType)) {
      return true;
    }
    String normalized = planType.trim().toUpperCase(Locale.ROOT);
    boolean partnerPlan = isPartnerPlan(pkg);
    return switch (normalized) {
      case "PARTNER_PLAN" -> partnerPlan;
      case "USER_PLAN" -> !partnerPlan;
      default -> true;
    };
  }

  private boolean isPartnerPlan(CreditPackage pkg) {
    if (pkg.getPartnerId() != null) {
      return true;
    }
    String code = pkg.getCode();
    return code != null && code.toUpperCase(Locale.ROOT).contains("PARTNER");
  }
}
