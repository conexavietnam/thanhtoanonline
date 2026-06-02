package com.example.app.controllers;

import com.example.app.dto.request.CheckoutRequest;
import com.example.app.dto.request.CreateOrderRequest;
import com.example.app.dto.request.CreatePaymentRequest;
import com.example.app.dto.response.CheckoutResponse;
import com.example.app.dto.response.CreditPackageResponse;
import com.example.app.dto.response.MaintenanceModeResponse;
import com.example.app.dto.response.OrderResponse;
import com.example.app.dto.response.PaymentRequestResponse;
import com.example.app.dto.response.PaymentReturnResponse;
import com.example.app.dto.response.PublicPlanResponse;
import com.example.app.models.PaymentProvider;
import com.example.app.repositories.OrderRepository;
import com.example.app.services.AdminSettingsService;
import com.example.app.services.BillingService;
import com.example.app.utils.ApiException;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FrontendCompatController {
  private final BillingService billingService;
  private final OrderRepository orderRepository;
  private final AdminSettingsService adminSettingsService;

  @GetMapping("/public/settings/general")
  public Map<String, Object> generalSettings() {
    return adminSettingsService.get();
  }

  @GetMapping("/public/settings")
  public Map<String, Object> settings() {
    return adminSettingsService.get();
  }

  @GetMapping("/public/settings/maintenance-mode")
  public MaintenanceModeResponse maintenanceMode() {
    Object val = adminSettingsService.get().get("maintenanceMode");
    return new MaintenanceModeResponse(Boolean.TRUE.equals(val));
  }

  @GetMapping("/public/branding/by-domain")
  public ResponseEntity<Void> brandingByDomain(@RequestParam("domain") String domain) {
    return ResponseEntity.notFound().build();
  }

  @GetMapping("/public/slides")
  public List<Object> slides() {
    Object slides = adminSettingsService.get().get("homepageSlides");
    if (slides instanceof List<?> list) {
      return new ArrayList<>(list);
    }
    return List.of();
  }

  @GetMapping("/public/plans")
  public List<PublicPlanResponse> userPlans() {
    return toPublicPlans("USER_PLAN");
  }

  @GetMapping("/public/plans/partner")
  public List<PublicPlanResponse> partnerPlans() {
    return toPublicPlans("PARTNER_PLAN");
  }

  @PostMapping("/payments/checkout")
  public CheckoutResponse checkout(
      Authentication authentication,
      @Valid @RequestBody CheckoutRequest request) {
    PaymentProvider provider = resolveProvider(request.provider());
    String note = buildCheckoutNote(request);

    OrderResponse order = billingService.createOrder(
        authentication.getName(),
        new CreateOrderRequest(request.planCode(), provider, note));

    String paymentUrl = null;
    if (provider != PaymentProvider.MANUAL) {
      PaymentRequestResponse paymentRequest = billingService.createPaymentRequest(
          authentication.getName(),
          new CreatePaymentRequest(order.id()));
      paymentUrl = paymentRequest.paymentUrl();
    }

    return new CheckoutResponse(
        order.id(),
        order.id().toString(),
        order.status(),
        paymentUrl,
        new CheckoutResponse.Payment(order.amountVnd(), order.provider(), order.status()));
  }

  @GetMapping("/payments/vnpay-return")
  public PaymentReturnResponse verifyPayment(@RequestParam Map<String, String> params) {
    String orderIdRaw = params.get("orderId");
    if (!StringUtils.hasText(orderIdRaw)) {
      return new PaymentReturnResponse("FAILED", null);
    }

    try {
      UUID orderId = UUID.fromString(orderIdRaw);
      return orderRepository.findById(orderId)
          .map(order -> new PaymentReturnResponse(order.getStatus().name(), order.getId().toString()))
          .orElseGet(() -> new PaymentReturnResponse("FAILED", orderIdRaw));
    } catch (IllegalArgumentException ex) {
      return new PaymentReturnResponse("FAILED", orderIdRaw);
    }
  }

  private List<PublicPlanResponse> toPublicPlans(String planType) {
    List<CreditPackageResponse> packages = billingService.listPackages(planType).stream()
        .filter(this::isPaidPackage)
        .toList();
    if (packages.isEmpty()) {
      return List.of();
    }

    int highlightedIndex = packages.size() > 1 ? 1 : 0;
    List<PublicPlanResponse> plans = new ArrayList<>();
    for (int i = 0; i < packages.size(); i++) {
      CreditPackageResponse creditPackage = packages.get(i);
      plans.add(new PublicPlanResponse(
          creditPackage.id(),
          creditPackage.code(),
          (creditPackage.name() != null && !creditPackage.name().isEmpty()) ? creditPackage.name()
              : ("Gói " + creditPackage.pdfExportLimit() + " lượt xuất PDF"),
          creditPackage.description() != null ? creditPackage.description()
              : "Thanh toán một lần để nhận thêm lượt xuất báo cáo DISC.",
          creditPackage.price(),
          "VND",
          "ONE_TIME",
          creditPackage.features() != null && !creditPackage.features().isEmpty() ? creditPackage.features()
              : List.of(
                  creditPackage.pdfExportLimit() + " lượt xuất PDF",
                  "Báo cáo chi tiết theo từng phiên test"),
          i == highlightedIndex,
          creditPackage.pdfExportLimit()));
    }
    return plans;
  }

  private boolean isPaidPackage(CreditPackageResponse creditPackage) {
    return creditPackage != null
        && creditPackage.price() > 0
        && !"FREE".equalsIgnoreCase(creditPackage.code());
  }

  private PaymentProvider resolveProvider(String rawProvider) {
    if (!StringUtils.hasText(rawProvider)) {
      return PaymentProvider.MANUAL;
    }

    String provider = rawProvider.trim().toUpperCase(Locale.ROOT);
    return switch (provider) {
      case "BANK_TRANSFER", "MANUAL" -> PaymentProvider.MANUAL;
      case "VNPAY", "VN_PAY" -> PaymentProvider.VNPAY;
      case "MOMO" -> PaymentProvider.MOMO;
      default -> throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PROVIDER", "Unsupported payment provider");
    };
  }

  private String buildCheckoutNote(CheckoutRequest request) {
    List<String> chunks = new ArrayList<>();
    if (StringUtils.hasText(request.phone())) {
      chunks.add("phone=" + request.phone().trim());
    }
    if (StringUtils.hasText(request.address())) {
      chunks.add("address=" + request.address().trim());
    }
    if (StringUtils.hasText(request.note())) {
      chunks.add("note=" + request.note().trim());
    }
    return chunks.isEmpty() ? null : String.join(" | ", chunks);
  }
}
