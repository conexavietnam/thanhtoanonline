package com.example.app.services;

import com.example.app.dto.request.UpdateReferralCommissionRequest;
import com.example.app.dto.request.UpdateReferralStatusRequest;
import com.example.app.dto.response.ReferralResponse;
import com.example.app.dto.response.ReferralStatsResponse;
import com.example.app.models.Referral;
import com.example.app.models.ReferralStatus;
import com.example.app.repositories.ReferralRepository;
import com.example.app.utils.ApiException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminReferralService {

  private final ReferralRepository referralRepository;

  public List<ReferralResponse> list(ReferralStatus status) {
    List<Referral> referrals = status == null
        ? referralRepository.findAllByOrderByCreatedAtDesc()
        : referralRepository.findByStatusOrderByCreatedAtDesc(status);
    return referrals.stream().map(this::toResponse).collect(Collectors.toList());
  }

  public ReferralResponse get(UUID id) {
    Referral referral = referralRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "REFERRAL_NOT_FOUND", "Referral not found"));
    return toResponse(referral);
  }

  @Transactional
  public ReferralResponse updateStatus(UUID id, UpdateReferralStatusRequest request) {
    Referral referral = referralRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "REFERRAL_NOT_FOUND", "Referral not found"));
    referral.setStatus(request.status());
    if (request.status() == ReferralStatus.PAID) {
      referral.setPaidAt(Instant.now());
    }
    return toResponse(referralRepository.save(referral));
  }

  @Transactional
  public ReferralResponse updateCommission(UUID id, UpdateReferralCommissionRequest request) {
    Referral referral = referralRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "REFERRAL_NOT_FOUND", "Referral not found"));
    if (request.commissionPercentage() != null) {
      referral.setCommissionPercentage(
          referral.getCommissionPercentage() == null
              ? java.math.BigDecimal.valueOf(request.commissionPercentage())
              : java.math.BigDecimal.valueOf(request.commissionPercentage()));
    }
    if (request.commissionAmount() != null) {
      referral.setCommissionAmountVnd(request.commissionAmount());
    }
    return toResponse(referralRepository.save(referral));
  }

  @Transactional
  public ReferralResponse markAsPaid(UUID id) {
    Referral referral = referralRepository.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "REFERRAL_NOT_FOUND", "Referral not found"));
    referral.setStatus(ReferralStatus.PAID);
    referral.setPaidAt(Instant.now());
    return toResponse(referralRepository.save(referral));
  }

  public ReferralStatsResponse stats() {
    List<Referral> all = referralRepository.findAll();
    long pending = all.stream().filter(r -> r.getStatus() == ReferralStatus.PENDING).count();
    long qualified = all.stream().filter(r -> r.getStatus() == ReferralStatus.QUALIFIED).count();
    long paid = all.stream().filter(r -> r.getStatus() == ReferralStatus.PAID).count();
    long cancelled = all.stream().filter(r -> r.getStatus() == ReferralStatus.CANCELLED).count();

    long totalPendingCommission = all.stream()
        .filter(r -> r.getStatus() == ReferralStatus.QUALIFIED || r.getStatus() == ReferralStatus.PENDING)
        .mapToLong(r -> r.getCommissionAmountVnd() == null ? 0 : r.getCommissionAmountVnd())
        .sum();

    long totalPaidCommission = all.stream()
        .filter(r -> r.getStatus() == ReferralStatus.PAID)
        .mapToLong(r -> r.getCommissionAmountVnd() == null ? 0 : r.getCommissionAmountVnd())
        .sum();

    return new ReferralStatsResponse(
        all.size(),
        pending,
        qualified,
        paid,
        cancelled,
        totalPendingCommission,
        totalPaidCommission
    );
  }

  private ReferralResponse toResponse(Referral r) {
    Double pct = r.getCommissionPercentage() == null ? null : r.getCommissionPercentage().doubleValue();
    return new ReferralResponse(
        r.getId(),
        r.getReferrerEmail(),
        r.getReferrerFullName(),
        r.getReferredUserEmail(),
        r.getReferredUserFullName(),
        r.getReferralCode(),
        r.getStatus().name(),
        pct,
        r.getCommissionAmountVnd(),
        r.getPaidAt()
    );
  }
}
