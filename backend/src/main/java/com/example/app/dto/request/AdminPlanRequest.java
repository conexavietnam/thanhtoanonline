package com.example.app.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class AdminPlanRequest {
    @NotBlank(message = "Mã gói không được để trống")
    private String code;

    private String name;

    @Min(value = 0, message = "Giá gói không được âm")
    private long price;

    private String currency;
    private String billingCycle;
    private String description;
    private List<String> features;
    private List<String> featureOptions;

    private boolean active = true;
    private boolean highlighted = false;

    @Min(value = 0, message = "Số credit phải từ 0 trở lên")
    private Integer pdfExportLimit;

    private UUID partnerId;
    private String planType; // Ignored by backend, used by frontend
}
