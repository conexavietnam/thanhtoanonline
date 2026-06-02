package com.example.app.dto.request;

import java.util.List;

public record ChangeUserRoleRequest(
        List<String> roles) {
}
