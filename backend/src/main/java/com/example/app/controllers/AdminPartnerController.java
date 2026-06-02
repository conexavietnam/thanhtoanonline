package com.example.app.controllers;

import com.example.app.dto.request.ChangeUserRoleRequest;
import com.example.app.dto.response.AdminUserDetailResponse;
import com.example.app.dto.response.AdminUserSummaryResponse;
import com.example.app.services.AdminUserService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import com.example.app.dto.request.AdminCreateUserRequest;
import com.example.app.dto.request.AdminUpdateUserRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/partners")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPartnerController {
    private final AdminUserService adminUserService;

    @GetMapping
    public List<AdminUserSummaryResponse> getAllPartners() {
        return adminUserService.listUsers("PARTNER", null, null);
    }

    @GetMapping("/{id}")
    public AdminUserDetailResponse getPartnerById(@PathVariable UUID id) {
        return adminUserService.getUserDetail(id);
    }

    @GetMapping("/user/{userId}")
    public AdminUserDetailResponse getPartnerByUserId(@PathVariable UUID userId) {
        return adminUserService.getUserDetail(userId);
    }

    @PostMapping("/convert/{userId}")
    public AdminUserSummaryResponse convertToPartner(@PathVariable UUID userId) {
        ChangeUserRoleRequest req = new ChangeUserRoleRequest(List.of("PARTNER"));
        return adminUserService.changeRole(userId, req);
    }

    @PostMapping
    public AdminUserSummaryResponse createPartner(@Valid @RequestBody AdminCreateUserRequest request) {
        if (request.getRoles() == null || request.getRoles().isEmpty()) {
            request.setRoles(List.of("PARTNER"));
        }
        return adminUserService.createUser(request);
    }

    @PutMapping("/{id}")
    public AdminUserSummaryResponse updatePartner(@PathVariable UUID id,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        return adminUserService.updateUser(id, request);
    }

    @DeleteMapping("/{id}")
    public void deletePartner(@PathVariable UUID id) {
        adminUserService.deleteUser(id);
    }
}
