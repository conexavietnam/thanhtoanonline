package com.example.app.repositories;

import com.example.app.models.AppSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppSettingsRepository extends JpaRepository<AppSettings, Integer> {
}
