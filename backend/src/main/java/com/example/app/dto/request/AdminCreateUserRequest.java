package com.example.app.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.Data;

@Data
public class AdminCreateUserRequest {
    @NotBlank(message = "Tên không được để trống")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    private String password;
    private String phoneNumber;
    private String avatarUrl;
    private List<String> roles;
    private String status;
}
