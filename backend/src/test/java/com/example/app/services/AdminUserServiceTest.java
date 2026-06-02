package com.example.app.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.app.dto.request.AdminCreateUserRequest;
import com.example.app.dto.request.ChangeUserRoleRequest;
import com.example.app.dto.response.AdminUserSummaryResponse;
import com.example.app.models.AppUser;
import com.example.app.models.UserRole;
import com.example.app.models.UserStatus;
import com.example.app.repositories.AppUserRepository;
import com.example.app.repositories.CreditTransactionRepository;
import com.example.app.utils.ApiException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AdminUserServiceTest {

  @Test
  void createUserAllowsAdminRoleAssignment() {
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    CreditTransactionRepository creditTransactionRepository = mock(CreditTransactionRepository.class);
    PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    AdminUserService service = new AdminUserService(
        appUserRepository,
        creditTransactionRepository,
        passwordEncoder);

    AdminCreateUserRequest request = new AdminCreateUserRequest();
    request.setEmail("user@company.com");
    request.setFullName("Regular User");
    request.setPassword("secret123");
    request.setRoles(List.of("ADMIN"));

    when(appUserRepository.existsByEmailIgnoreCase("user@company.com")).thenReturn(false);
    when(passwordEncoder.encode("secret123")).thenReturn("encoded-secret");
    when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

    AdminUserSummaryResponse response = service.createUser(request);

    assertEquals("ADMIN", response.role());
    verify(appUserRepository).save(any(AppUser.class));
  }

  @Test
  void createUserRejectsReservedExampleDomain() {
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    CreditTransactionRepository creditTransactionRepository = mock(CreditTransactionRepository.class);
    PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    AdminUserService service = new AdminUserService(
        appUserRepository,
        creditTransactionRepository,
        passwordEncoder);

    AdminCreateUserRequest request = new AdminCreateUserRequest();
    request.setEmail("codex.free.pdf@example.com");
    request.setFullName("Trash User");

    ApiException exception = assertThrows(ApiException.class, () -> service.createUser(request));

    assertEquals("RESERVED_EMAIL_DOMAIN", exception.getCode());
  }

  @Test
  void listUsersHidesUnverifiedReservedDomainAccounts() {
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    CreditTransactionRepository creditTransactionRepository = mock(CreditTransactionRepository.class);
    PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    AdminUserService service = new AdminUserService(
        appUserRepository,
        creditTransactionRepository,
        passwordEncoder);

    AppUser trashUser = new AppUser();
    trashUser.setId(UUID.randomUUID());
    trashUser.setEmail("codex.free.pdf@example.com");
    trashUser.setFullName("Trash User");
    trashUser.setRole(UserRole.USER);
    trashUser.setStatus(UserStatus.PENDING_VERIFICATION);
    trashUser.setEmailVerified(false);

    AppUser realUser = new AppUser();
    realUser.setId(UUID.randomUUID());
    realUser.setEmail("real.user@gmail.com");
    realUser.setFullName("Real User");
    realUser.setRole(UserRole.USER);
    realUser.setStatus(UserStatus.ACTIVE);
    realUser.setEmailVerified(true);

    when(appUserRepository.findAll()).thenReturn(List.of(trashUser, realUser));

    List<AdminUserSummaryResponse> users = service.listUsers(null, null, null);

    assertEquals(1, users.size());
    assertEquals("real.user@gmail.com", users.get(0).email());
  }

  @Test
  void changeRoleAllowsAdminAssignmentEvenWhenMixedWithOtherRoles() {
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    CreditTransactionRepository creditTransactionRepository = mock(CreditTransactionRepository.class);
    PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    AdminUserService service = new AdminUserService(
        appUserRepository,
        creditTransactionRepository,
        passwordEncoder);

    UUID userId = UUID.randomUUID();
    AppUser user = new AppUser();
    user.setId(userId);
    user.setEmail("user@company.com");
    user.setFullName("Regular User");
    user.setRole(UserRole.USER);
    user.setStatus(UserStatus.ACTIVE);

    when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
    when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

    AdminUserSummaryResponse response =
        service.changeRole(userId, new ChangeUserRoleRequest(List.of("PARTNER", "ADMIN")));

    assertEquals("ADMIN", response.role());
    assertEquals(UserRole.ADMIN, user.getRole());
    verify(appUserRepository).save(user);
  }

  @Test
  void changeRoleAllowsPartnerAssignment() {
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    CreditTransactionRepository creditTransactionRepository = mock(CreditTransactionRepository.class);
    PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    AdminUserService service = new AdminUserService(
        appUserRepository,
        creditTransactionRepository,
        passwordEncoder);

    UUID userId = UUID.randomUUID();
    AppUser user = new AppUser();
    user.setId(userId);
    user.setEmail("user@company.com");
    user.setFullName("Regular User");
    user.setRole(UserRole.USER);
    user.setStatus(UserStatus.ACTIVE);

    when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
    when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

    AdminUserSummaryResponse response =
        service.changeRole(userId, new ChangeUserRoleRequest(List.of("PARTNER")));

    assertEquals("PARTNER", response.role());
    assertEquals(UserRole.PARTNER, user.getRole());
    verify(appUserRepository).save(user);
  }

  @Test
  void changeRolePrefersSuperAdminOverAdmin() {
    AppUserRepository appUserRepository = mock(AppUserRepository.class);
    CreditTransactionRepository creditTransactionRepository = mock(CreditTransactionRepository.class);
    PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    AdminUserService service = new AdminUserService(
        appUserRepository,
        creditTransactionRepository,
        passwordEncoder);

    UUID userId = UUID.randomUUID();
    AppUser user = new AppUser();
    user.setId(userId);
    user.setEmail("user@company.com");
    user.setFullName("Regular User");
    user.setRole(UserRole.USER);
    user.setStatus(UserStatus.ACTIVE);

    when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
    when(appUserRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

    AdminUserSummaryResponse response =
        service.changeRole(userId, new ChangeUserRoleRequest(List.of("ADMIN", "SUPER_ADMIN")));

    assertEquals("SUPER_ADMIN", response.role());
    assertEquals(UserRole.SUPER_ADMIN, user.getRole());
    verify(appUserRepository).save(user);
  }
}
