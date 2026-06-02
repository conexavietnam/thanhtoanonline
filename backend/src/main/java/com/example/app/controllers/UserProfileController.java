package com.example.app.controllers;

import com.example.app.dto.response.UserMeResponse;
import com.example.app.services.UserProfileService;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class UserProfileController {

  private final UserProfileService userProfileService;

  @GetMapping
  public UserMeResponse me(Authentication authentication) {
    return userProfileService.getProfile(authentication.getName());
  }

  public record UpdateProfileRequest(
      @NotBlank(message = "fullName is required") String fullName,
      String phoneNumber,
      LocalDate dateOfBirth,
      String gender,
      String address
  ) {
  }

  @PutMapping
  public UserMeResponse update(Authentication authentication, @RequestBody UpdateProfileRequest request) {
    return userProfileService.updateProfile(authentication.getName(), request);
  }

  @PostMapping("/register-partner")
  public UserMeResponse registerPartner(Authentication authentication) {
    return userProfileService.registerAsPartner(authentication.getName());
  }
}
