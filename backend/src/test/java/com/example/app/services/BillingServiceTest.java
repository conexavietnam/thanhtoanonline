package com.example.app.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.app.dto.request.CreateOrderRequest;
import com.example.app.dto.response.OrderResponse;
import com.example.app.models.AppUser;
import com.example.app.models.CreditPackage;
import com.example.app.models.Order;
import com.example.app.models.OrderStatus;
import com.example.app.models.PaymentProvider;
import com.example.app.repositories.AppUserRepository;
import com.example.app.repositories.CreditPackageRepository;
import com.example.app.repositories.CreditTransactionRepository;
import com.example.app.repositories.OrderRepository;
import com.example.app.repositories.PaymentEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class BillingServiceTest {

  @Test
  void createOrderReusesExistingPendingOrderForSameUserPackageAndProvider() {
    UserAccountService userAccountService = mock(UserAccountService.class);
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    CreditPackageRepository creditPackageRepository = mock(CreditPackageRepository.class);
    OrderRepository orderRepository = mock(OrderRepository.class);
    PaymentEventRepository paymentEventRepository = mock(PaymentEventRepository.class);
    CreditTransactionRepository creditTransactionRepository = mock(CreditTransactionRepository.class);
    AffiliateService affiliateService = mock(AffiliateService.class);
    BillingService service = new BillingService(
        userAccountService,
        appUserRepository,
        creditPackageRepository,
        orderRepository,
        paymentEventRepository,
        creditTransactionRepository,
        affiliateService,
        new ObjectMapper());

    UUID userId = UUID.randomUUID();
    UUID packageId = UUID.randomUUID();

    AppUser user = new AppUser();
    user.setId(userId);
    user.setEmail("user@example.com");

    CreditPackage creditPackage = new CreditPackage();
    creditPackage.setId(packageId);
    creditPackage.setCode("DISC_PRO");
    creditPackage.setCredits(10);
    creditPackage.setPriceVnd(199000);
    creditPackage.setActive(true);

    Order existingOrder = new Order();
    existingOrder.setId(UUID.randomUUID());
    existingOrder.setUser(user);
    existingOrder.setCreditPackage(creditPackage);
    existingOrder.setProvider(PaymentProvider.MANUAL);
    existingOrder.setStatus(OrderStatus.PENDING);
    existingOrder.setAmountVnd(199000);
    existingOrder.setCreatedAt(Instant.now());
    existingOrder.setUpdatedAt(Instant.now());
    existingOrder.setNote("old note");

    when(userAccountService.requireByEmail("user@example.com")).thenReturn(user);
    when(creditPackageRepository.findByCode("DISC_PRO")).thenReturn(Optional.of(creditPackage));
    when(orderRepository.findFirstByUserIdAndCreditPackageIdAndProviderAndStatusOrderByCreatedAtDesc(
        userId,
        packageId,
        PaymentProvider.MANUAL,
        OrderStatus.PENDING)).thenReturn(Optional.of(existingOrder));
    when(orderRepository.save(existingOrder)).thenReturn(existingOrder);

    OrderResponse response = service.createOrder(
        "user@example.com",
        new CreateOrderRequest("disc_pro", PaymentProvider.MANUAL, "  refreshed note  "));

    assertEquals(existingOrder.getId(), response.id());
    assertEquals("refreshed note", existingOrder.getNote());
    assertEquals("PENDING", response.status());
    verify(orderRepository).save(existingOrder);
  }

  @Test
  void createOrderCreatesNewOrderWhenNoReusablePendingOrderExists() {
    UserAccountService userAccountService = mock(UserAccountService.class);
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    CreditPackageRepository creditPackageRepository = mock(CreditPackageRepository.class);
    OrderRepository orderRepository = mock(OrderRepository.class);
    PaymentEventRepository paymentEventRepository = mock(PaymentEventRepository.class);
    CreditTransactionRepository creditTransactionRepository = mock(CreditTransactionRepository.class);
    AffiliateService affiliateService = mock(AffiliateService.class);
    BillingService service = new BillingService(
        userAccountService,
        appUserRepository,
        creditPackageRepository,
        orderRepository,
        paymentEventRepository,
        creditTransactionRepository,
        affiliateService,
        new ObjectMapper());

    UUID userId = UUID.randomUUID();
    UUID packageId = UUID.randomUUID();

    AppUser user = new AppUser();
    user.setId(userId);
    user.setEmail("user@example.com");

    CreditPackage creditPackage = new CreditPackage();
    creditPackage.setId(packageId);
    creditPackage.setCode("DISC_PRO");
    creditPackage.setCredits(12);
    creditPackage.setPriceVnd(299000);
    creditPackage.setActive(true);

    when(userAccountService.requireByEmail("user@example.com")).thenReturn(user);
    when(creditPackageRepository.findByCode("DISC_PRO")).thenReturn(Optional.of(creditPackage));
    when(orderRepository.findFirstByUserIdAndCreditPackageIdAndProviderAndStatusOrderByCreatedAtDesc(
        userId,
        packageId,
        PaymentProvider.MANUAL,
        OrderStatus.PENDING)).thenReturn(Optional.empty());
    when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
      Order order = invocation.getArgument(0);
      order.setId(UUID.randomUUID());
      order.setCreatedAt(Instant.now());
      order.setUpdatedAt(Instant.now());
      return order;
    });

    OrderResponse response = service.createOrder(
        "user@example.com",
        new CreateOrderRequest("disc_pro", PaymentProvider.MANUAL, "new note"));

    ArgumentCaptor<Order> orderCaptor = ArgumentCaptor.forClass(Order.class);
    verify(orderRepository).save(orderCaptor.capture());
    Order savedOrder = orderCaptor.getValue();

    assertNotNull(savedOrder.getId());
    assertEquals(user, savedOrder.getUser());
    assertEquals(creditPackage, savedOrder.getCreditPackage());
    assertEquals(PaymentProvider.MANUAL, savedOrder.getProvider());
    assertEquals(OrderStatus.PENDING, savedOrder.getStatus());
    assertEquals(299000, savedOrder.getAmountVnd());
    assertEquals("new note", savedOrder.getNote());
    assertEquals(savedOrder.getId(), response.id());
    verify(orderRepository).findFirstByUserIdAndCreditPackageIdAndProviderAndStatusOrderByCreatedAtDesc(
        eq(userId),
        eq(packageId),
        eq(PaymentProvider.MANUAL),
        eq(OrderStatus.PENDING));
  }
}
