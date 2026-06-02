package com.example.app.services;

import com.example.app.models.AppSettings;
import com.example.app.repositories.AppSettingsRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminSettingsService {

    private static final int SETTINGS_ID = 1;
    private static final String DEFAULT_COMPANY_NAME = "Công ty cổ phần đào tạo đánh thức tiềm năng Việt";
    private static final String DEFAULT_COMPANY_ADDRESS = "Lô 10, MB 20 Phố Thành Yên, Phường Quảng Phú, Tỉnh Thanh Hóa.";
    private static final String DEFAULT_CONTACT_PHONE = "0984.686.616";
    private static final String DEFAULT_CONTACT_ZALO = "0911586728";
    // Quốc Trí: expose the homepage banners by default until admin overrides them in settings.
    private static final List<Map<String, Object>> DEFAULT_HOMEPAGE_SLIDES = List.of(
            Map.of(
                    "imageUrl", "/banner1.jpg",
                    "title", "Lan tỏa lòng biết ơn",
                    "altText", "Banner dự án lan tỏa lòng biết ơn",
                    "link", ""),
            Map.of(
                    "imageUrl", "/banner2.jpg",
                    "title", "Hướng nghiệp thành công",
                    "altText", "Banner hướng nghiệp thành công",
                    "link", ""),
            Map.of(
                    "imageUrl", "/banner3.jpg",
                    "title", "Đào Ngọc Cường",
                    "altText", "Banner diễn giả Đào Ngọc Cường",
                    "link", ""));

    private final AppSettingsRepository appSettingsRepository;

    public Map<String, Object> get() {
        Map<String, Object> settings = appSettingsRepository.findById(SETTINGS_ID)
                .map(AppSettings::getData)
                .orElseGet(HashMap::new);
        Map<String, Object> resolved = new HashMap<>(settings == null ? Map.of() : settings);
        putDefaultText(resolved, "logoUrl", "/logo.png");
        putDefaultText(resolved, "companyName", DEFAULT_COMPANY_NAME);
        putDefaultText(resolved, "companyAddress", DEFAULT_COMPANY_ADDRESS);
        putDefaultText(resolved, "contactPhone", DEFAULT_CONTACT_PHONE);
        putDefaultText(resolved, "contactZalo", DEFAULT_CONTACT_ZALO);
        resolved.putIfAbsent("homepageSlides", DEFAULT_HOMEPAGE_SLIDES);
        return resolved;
    }

    private void putDefaultText(Map<String, Object> settings, String key, String defaultValue) {
        Object rawValue = settings.get(key);
        if (!(rawValue instanceof String textValue) || textValue.isBlank()) {
            settings.put(key, defaultValue);
        }
    }

    @Transactional
    public Map<String, Object> update(Map<String, Object> incoming) {
        AppSettings settings = appSettingsRepository.findById(SETTINGS_ID)
                .orElseGet(() -> {
                    AppSettings s = new AppSettings();
                    s.setId(SETTINGS_ID);
                    s.setData(new HashMap<>());
                    return s;
                });

        // Merge incoming over existing — preserves any keys not sent by frontend
        Map<String, Object> merged = new HashMap<>(settings.getData() == null ? new HashMap<>() : settings.getData());
        merged.putAll(incoming);
        settings.setData(merged);

        return appSettingsRepository.save(settings).getData();
    }
}
