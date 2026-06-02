package com.example.app.controllers;

import com.example.app.services.AdminSettingsService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSettingsController {

    private final AdminSettingsService adminSettingsService;

    @GetMapping
    public Map<String, Object> get() {
        return adminSettingsService.get();
    }

    @PutMapping
    public Map<String, Object> update(@RequestBody Map<String, Object> body) {
        return adminSettingsService.update(body);
    }
}
