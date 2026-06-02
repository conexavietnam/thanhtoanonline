package com.example.app.services;

import com.example.app.dto.request.UpdateAffiliatePercentRequest;
import com.example.app.dto.request.UpdateOrderStatusRequest;
import com.example.app.dto.response.AdminOverviewResponse;
import com.example.app.dto.response.OrderResponse;
import com.example.app.models.AffiliateConfig;
import com.example.app.models.Order;
import com.example.app.models.OrderStatus;
import com.example.app.models.UserRole;
import com.example.app.repositories.AffiliateConfigRepository;
import com.example.app.repositories.AffiliateEarningRepository;
import com.example.app.repositories.AppUserRepository;
import com.example.app.repositories.OrderRepository;
import com.example.app.repositories.PdfExportRepository;
import com.example.app.repositories.TestSessionRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminFinanceService {
  private final BillingService billingService;
  private final AffiliateConfigRepository affiliateConfigRepository;
  private final AppUserRepository appUserRepository;
  private final TestSessionRepository testSessionRepository;
  private final PdfExportRepository pdfExportRepository;
  private final OrderRepository orderRepository;
  private final AffiliateEarningRepository affiliateEarningRepository;

  public List<OrderResponse> listOrders(OrderStatus status) {
    return billingService.listAllOrders(status);
  }

  @Transactional
  public OrderResponse updateOrderStatus(UUID orderId, UpdateOrderStatusRequest request) {
    return billingService.markOrderStatus(orderId, request.status(), request.note());
  }

  @Transactional
  public void updateAffiliatePercent(UpdateAffiliatePercentRequest request) {
    List<AffiliateConfig> activeConfigs = affiliateConfigRepository.findByIsActiveTrueOrderByCreatedAtDesc();
    for (AffiliateConfig config : activeConfigs) {
      config.setActive(false);
      affiliateConfigRepository.save(config);
    }

    AffiliateConfig config = new AffiliateConfig();
    config.setPercent(request.percent());
    config.setActive(true);
    affiliateConfigRepository.save(config);
  }

  public AdminOverviewResponse overview() {
    long totalUsers = appUserRepository.count();
    long totalPartners = appUserRepository.countByRole(UserRole.PARTNER);
    long totalTests = testSessionRepository.count();
    long totalExports = pdfExportRepository.count();

    long totalRevenue = orderRepository.findAll().stream()
        .filter(order -> order.getStatus() == OrderStatus.COMPLETED)
        .mapToLong(Order::getAmountVnd)
        .sum();

    long totalCost = testSessionRepository.findAll().stream()
        .mapToLong(session -> session.getCostVnd())
        .sum();

    long totalAffiliate = affiliateEarningRepository.findAll().stream()
        .mapToLong(earning -> earning.getAmountVnd())
        .sum();

    return new AdminOverviewResponse(
        totalUsers,
        totalPartners,
        totalTests,
        totalExports,
        totalRevenue,
        totalCost,
        totalAffiliate
    );
  }
}
