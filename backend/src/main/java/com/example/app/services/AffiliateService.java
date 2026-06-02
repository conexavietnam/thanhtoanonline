package com.example.app.services;

import com.example.app.dto.response.AffiliateEarningResponse;
import com.example.app.dto.response.AffiliateSummaryResponse;
import com.example.app.dto.response.ReferralUserResponse;
import com.example.app.models.AffiliateConfig;
import com.example.app.models.AffiliateEarning;
import com.example.app.models.AppUser;
import com.example.app.models.Order;
import com.example.app.repositories.AffiliateConfigRepository;
import com.example.app.repositories.AffiliateEarningRepository;
import com.example.app.repositories.AppUserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AffiliateService {
  private final UserAccountService userAccountService;
  private final AppUserRepository appUserRepository;
  private final AffiliateConfigRepository affiliateConfigRepository;
  private final AffiliateEarningRepository affiliateEarningRepository;

  @Value("${app.base-url:http://localhost:5174}")
  private String appBaseUrl;

  @Transactional
  public AffiliateSummaryResponse summary(String email) {
    AppUser user = userAccountService.requireByEmail(email);
    user = userAccountService.ensureReferralCode(user);

    long referredCount = appUserRepository.countByReferredByCode(user.getReferralCode());
    List<AffiliateEarning> earnings = affiliateEarningRepository.findByPartnerUserIdOrderByCreatedAtDesc(user.getId());

    long totalAmount = earnings.stream().mapToLong(AffiliateEarning::getAmountVnd).sum();
    long totalPaidOrders = earnings.size();
    BigDecimal percent = currentPercent();

    return new AffiliateSummaryResponse(
        user.getReferralCode(),
        appBaseUrl + "/register?ref=" + user.getReferralCode(),
        referredCount,
        totalAmount,
        totalPaidOrders,
        percent
    );
  }

  public List<AffiliateEarningResponse> earnings(String email) {
    AppUser user = userAccountService.requireByEmail(email);
    return affiliateEarningRepository.findByPartnerUserIdOrderByCreatedAtDesc(user.getId()).stream()
        .map(earning -> new AffiliateEarningResponse(
            earning.getId(),
            earning.getOrder().getId(),
            earning.getFromUser().getEmail(),
            earning.getAmountVnd(),
            earning.getPercent(),
            earning.getCreatedAt(),
            earning.getNote()
        ))
        .toList();
  }

  public List<ReferralUserResponse> referredUsers(String email) {
    AppUser user = userAccountService.requireByEmail(email);
    user = userAccountService.ensureReferralCode(user);

    return appUserRepository.findTop500ByReferredByCodeOrderByCreatedAtDesc(user.getReferralCode()).stream()
        .map(referred -> new ReferralUserResponse(
            referred.getId(),
            referred.getEmail(),
            referred.getFullName(),
            referred.getCreatedAt()
        ))
        .toList();
  }

  @Transactional
  public void handleCompletedOrder(Order order) {
    if (order == null || order.getUser() == null) {
      return;
    }

    AppUser buyer = order.getUser();
    if (buyer.getReferredByCode() == null || buyer.getReferredByCode().isBlank()) {
      return;
    }

    if (!affiliateEarningRepository.findByOrderId(order.getId()).isEmpty()) {
      return;
    }

    AppUser partner = appUserRepository.findByReferralCode(buyer.getReferredByCode()).orElse(null);
    if (partner == null || partner.getId().equals(buyer.getId())) {
      return;
    }

    BigDecimal percent = currentPercent();
    if (percent.compareTo(BigDecimal.ZERO) <= 0) {
      return;
    }

    long amount = percent
        .multiply(BigDecimal.valueOf(order.getAmountVnd()))
        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP)
        .longValue();

    AffiliateEarning earning = new AffiliateEarning();
    earning.setPartnerUser(partner);
    earning.setFromUser(buyer);
    earning.setOrder(order);
    earning.setPercent(percent);
    earning.setAmountVnd(Math.max(0, amount));
    earning.setNote("Affiliate commission for completed order " + order.getId());
    affiliateEarningRepository.save(earning);
  }

  public BigDecimal currentPercent() {
    return affiliateConfigRepository.findFirstByIsActiveTrueOrderByCreatedAtDesc()
        .map(AffiliateConfig::getPercent)
        .orElse(BigDecimal.ZERO);
  }
}
