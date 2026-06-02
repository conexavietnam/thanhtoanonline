package com.example.app.services;

import com.example.app.models.AppUser;
import com.example.app.models.UserRole;
import com.example.app.models.UserStatus;
import com.example.app.repositories.AppUserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
  private final AppUserRepository appUserRepository;

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    String normalized = username.toLowerCase(Locale.ROOT);
    AppUser user = appUserRepository
        .findByEmailIgnoreCase(normalized)
        .orElseThrow(() -> new UsernameNotFoundException("User not found"));

    if (user.getStatus() != UserStatus.ACTIVE || !user.isEmailVerified()) {
      throw new UsernameNotFoundException("User is not active");
    }

    String passwordHash = user.getPasswordHash() == null ? "" : user.getPasswordHash();
    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
    authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    if (user.getRole() == UserRole.SUPER_ADMIN) {
      // Quốc Trí: SUPER_ADMIN kế thừa full quyền ADMIN để không phải sửa toàn bộ @PreAuthorize cũ.
      authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    return new User(
        user.getEmail(),
        passwordHash,
        authorities
    );
  }
}
