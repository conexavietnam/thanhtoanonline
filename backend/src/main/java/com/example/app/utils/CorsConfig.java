package com.example.app.utils;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {
  @Value("${app.cors-allowed-origins:http://localhost:5174,http://127.0.0.1:5174,http://localhost:4174,http://127.0.0.1:4174}")
  private String corsAllowedOrigins;

  private CorsConfiguration buildConfig() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowCredentials(true);
    configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setExposedHeaders(List.of("Authorization", "Content-Disposition", "Location"));

    List<String> allowedOrigins = Arrays.stream(corsAllowedOrigins.split(","))
        .map(String::trim)
        .filter(StringUtils::hasText)
        .toList();
    configuration.setAllowedOriginPatterns(allowedOrigins);
    return configuration;
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", buildConfig());
    return source;
  }

  // Explicit CorsFilter ensures the configuration runs before Spring Security for preflight OPTIONS.
  @Bean
  public FilterRegistrationBean<CorsFilter> corsFilter() {
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", buildConfig());
    CorsFilter filter = new CorsFilter(source);

    FilterRegistrationBean<CorsFilter> bean = new FilterRegistrationBean<>(filter);
    bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
    return bean;
  }
}
