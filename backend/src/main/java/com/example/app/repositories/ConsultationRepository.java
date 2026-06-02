package com.example.app.repositories;

import com.example.app.models.Consultation;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsultationRepository extends JpaRepository<Consultation, UUID> {
}
