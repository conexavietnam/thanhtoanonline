package com.example.app.repositories;

import com.example.app.models.TelegramMessage;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TelegramMessageRepository extends JpaRepository<TelegramMessage, UUID> {
}
