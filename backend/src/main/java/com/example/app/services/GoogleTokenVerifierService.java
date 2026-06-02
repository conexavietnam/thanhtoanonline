package com.example.app.services;

import com.example.app.utils.ApiException;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
public class GoogleTokenVerifierService {
  private static final String GOOGLE_ISSUER_1 = "accounts.google.com";
  private static final String GOOGLE_ISSUER_2 = "https://accounts.google.com";

  private final RestClient restClient;
  private final String oauthClientId;
  private final String oauthClientSecret;
  private final List<String> allowedClientIds;

  public GoogleTokenVerifierService(
      @Value("${google.oauth.client-id:}") String oauthClientId,
      @Value("${google.oauth.client-secret:}") String oauthClientSecret,
      @Value("${google.oauth.client-ids:}") String clientIds) {
    this.restClient = RestClient.builder()
        .baseUrl("https://oauth2.googleapis.com")
        .build();
    this.oauthClientId = oauthClientId == null ? "" : oauthClientId.trim();
    this.oauthClientSecret = oauthClientSecret == null ? "" : oauthClientSecret.trim();
    this.allowedClientIds = resolveAllowedClientIds(clientIds, this.oauthClientId);
  }

  public GoogleIdentity verifyAuthorizationCode(String code, String redirectUri) {
    String idToken = exchangeAuthorizationCode(code, redirectUri);
    return verifyIdToken(idToken);
  }

  public GoogleIdentity verifyIdToken(String idToken) {
    if (allowedClientIds.isEmpty()) {
      throw new ApiException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "GOOGLE_OAUTH_NOT_CONFIGURED",
          "Google OAuth client ids are not configured"
      );
    }

    Map<String, Object> tokenInfo = fetchTokenInfo(idToken);

    String audience = asString(tokenInfo.get("aud"));
    if (!allowedClientIds.contains(audience)) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_AUDIENCE", "Invalid Google token audience");
    }

    String issuer = asString(tokenInfo.get("iss"));
    if (!GOOGLE_ISSUER_1.equals(issuer) && !GOOGLE_ISSUER_2.equals(issuer)) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_ISSUER", "Invalid Google token issuer");
    }

    long exp = parseLong(tokenInfo.get("exp"));
    if (exp <= Instant.now().getEpochSecond()) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "EXPIRED_GOOGLE_TOKEN", "Google token is expired");
    }

    String email = asString(tokenInfo.get("email"));
    boolean emailVerified = Boolean.parseBoolean(asString(tokenInfo.get("email_verified")));

    if (email == null || email.isBlank()) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "GOOGLE_EMAIL_MISSING", "Google token does not contain email");
    }

    if (!emailVerified) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "GOOGLE_EMAIL_NOT_VERIFIED", "Google email is not verified");
    }

    String fullName = asString(tokenInfo.get("name"));
    String pictureUrl = asString(tokenInfo.get("picture"));
    String googleSubject = asString(tokenInfo.get("sub"));

    return new GoogleIdentity(email, fullName, pictureUrl, googleSubject);
  }

  private List<String> resolveAllowedClientIds(String clientIds, String clientId) {
    LinkedHashSet<String> uniqueIds = Arrays.stream(clientIds.split(","))
        .map(String::trim)
        .filter(id -> !id.isEmpty())
        .collect(Collectors.toCollection(LinkedHashSet::new));

    if (clientId != null && !clientId.isBlank()) {
      uniqueIds.add(clientId);
    }

    return List.copyOf(uniqueIds);
  }

  private String exchangeAuthorizationCode(String code, String redirectUri) {
    if (oauthClientId.isBlank() || oauthClientSecret.isBlank()) {
      throw new ApiException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "GOOGLE_OAUTH_SECRET_NOT_CONFIGURED",
          "Google OAuth client id/client secret are not configured"
      );
    }

    MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
    form.add("code", code);
    form.add("client_id", oauthClientId);
    form.add("client_secret", oauthClientSecret);
    form.add("redirect_uri", redirectUri);
    form.add("grant_type", "authorization_code");

    Map<String, Object> tokenResponse;
    try {
      tokenResponse = restClient.post()
          .uri("/token")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .body(form)
          .retrieve()
          .body(new ParameterizedTypeReference<Map<String, Object>>() {
          });
    } catch (RestClientResponseException ex) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_CODE", "Invalid Google authorization code");
    } catch (Exception ex) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "GOOGLE_EXCHANGE_FAILED", "Google code exchange failed");
    }

    String idToken = asString(tokenResponse == null ? null : tokenResponse.get("id_token"));
    if (idToken == null || idToken.isBlank()) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_CODE", "Invalid Google authorization code");
    }
    return idToken;
  }

  private Map<String, Object> fetchTokenInfo(String idToken) {
    Map<String, Object> tokenInfo;
    try {
      tokenInfo = restClient.get()
          .uri(uriBuilder -> uriBuilder.path("/tokeninfo").queryParam("id_token", idToken).build())
          .retrieve()
          .body(new ParameterizedTypeReference<Map<String, Object>>() {
          });
    } catch (RestClientResponseException ex) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Invalid Google token");
    } catch (Exception ex) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "GOOGLE_VERIFICATION_FAILED", "Google verification failed");
    }

    if (tokenInfo == null) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Invalid Google token");
    }
    return tokenInfo;
  }

  private String asString(Object value) {
    return value == null ? null : String.valueOf(value);
  }

  private long parseLong(Object value) {
    try {
      return Long.parseLong(String.valueOf(value));
    } catch (Exception ex) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_GOOGLE_TOKEN", "Invalid Google token payload");
    }
  }

  public record GoogleIdentity(String email, String fullName, String pictureUrl, String subject) {
  }
}
