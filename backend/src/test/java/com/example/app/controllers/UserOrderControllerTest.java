package com.example.app.controllers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import com.example.app.dto.response.OrderStatusResponse;
import com.example.app.models.AppUser;
import com.example.app.models.CreditPackage;
import com.example.app.models.Order;
import com.example.app.models.OrderStatus;
import com.example.app.repositories.OrderRepository;
import com.example.app.services.UserAccountService;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

class UserOrderControllerTest {

  @Test
  void getOrderStatusReturnsPackageInfo() {
    OrderRepository orderRepository = Mockito.mock(OrderRepository.class);
    UserAccountService userAccountService = Mockito.mock(UserAccountService.class);
    Authentication authentication = Mockito.mock(Authentication.class);

    AppUser user = new AppUser();
    UUID userId = UUID.randomUUID();
    user.setId(userId);
    when(authentication.getName()).thenReturn("user@example.com");
    when(userAccountService.requireByEmail("user@example.com")).thenReturn(user);

    CreditPackage creditPackage = new CreditPackage();
    creditPackage.setCode("PKG_1");
    creditPackage.setCredits(1);

    Order order = new Order();
    UUID orderId = UUID.randomUUID();
    order.setId(orderId);
    order.setUser(user);
    order.setCreditPackage(creditPackage);
    order.setStatus(OrderStatus.COMPLETED);
    order.setAmountVnd(468000);
    order.setProvider(com.example.app.models.PaymentProvider.SEPAY);
    order.setCreatedAt(Instant.now());
    order.setUpdatedAt(Instant.now());

    when(orderRepository.findByIdAndUserId(orderId, userId)).thenReturn(Optional.of(order));

    UserOrderController controller = new UserOrderController(orderRepository, userAccountService);
    ResponseEntity<OrderStatusResponse> response = controller.getOrderStatus(authentication, orderId);

    assertEquals("COMPLETED", response.getBody().status());
    assertEquals("PKG_1", response.getBody().packageCode());
    assertEquals(1, response.getBody().credits());
    assertEquals("SEPAY", response.getBody().provider());
  }
}
