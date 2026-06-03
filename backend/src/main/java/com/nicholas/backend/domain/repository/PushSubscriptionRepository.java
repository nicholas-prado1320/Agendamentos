package com.nicholas.backend.domain.repository;

import com.nicholas.backend.domain.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    Optional<PushSubscription> findByEndpoint(String endpoint);

    List<PushSubscription> findByUsuarioIdAndAtivoTrue(Long usuarioId);
}