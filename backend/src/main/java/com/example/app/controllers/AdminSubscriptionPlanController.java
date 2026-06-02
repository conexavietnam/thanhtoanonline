package com.example.app.controllers;

import com.example.app.dto.request.AdminPlanRequest;
import com.example.app.dto.response.CreditPackageResponse;
import com.example.app.services.BillingService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/plans")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSubscriptionPlanController {

    private final BillingService billingService;

    @GetMapping
    public List<CreditPackageResponse> getPlans(
            @RequestParam(value = "planType", required = false) String planType,
            @RequestParam(value = "includeInactive", defaultValue = "false") boolean includeInactive) {
        return billingService.listAllPackages(planType, includeInactive);
    }

    @GetMapping("/{id}")
    public CreditPackageResponse getPlanById(@PathVariable UUID id) {
        return billingService.listAllPackages().stream()
                .filter(p -> p.id().equals(id))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));
    }

    @PostMapping
    public CreditPackageResponse createPlan(@RequestBody AdminPlanRequest request) {
        return billingService.createPackage(request);
    }

    @PutMapping("/{id}")
    public CreditPackageResponse updatePlan(@PathVariable UUID id, @RequestBody AdminPlanRequest request) {
        return billingService.updatePackage(id, request);
    }

    @DeleteMapping("/{id}")
    public void deletePlan(@PathVariable UUID id) {
        billingService.deletePackage(id);
    }
}
