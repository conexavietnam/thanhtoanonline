package com.example.app.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminUpdateUserRequest {
    @NotBlank(message = "Tên không được để trống")
    private String fullName;

    @Email(message = "Email không hợp lệ")
    private String email;

    private String phoneNumber;
    private String avatarUrl;
    private String status;
    private String planCode;
    private Integer pdfExportCredits;
}
