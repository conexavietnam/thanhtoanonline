package com.example.app.repositories;

import com.example.app.models.PdfExport;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PdfExportRepository extends JpaRepository<PdfExport, UUID> {
  List<PdfExport> findBySessionOwnerUserIdOrderByCreatedAtDesc(UUID ownerUserId);

  List<PdfExport> findBySessionIdOrderByCreatedAtDesc(UUID sessionId);

  Optional<PdfExport> findByIdAndSessionOwnerUserId(UUID id, UUID ownerUserId);
}
