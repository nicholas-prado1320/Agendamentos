package com.nicholas.backend.domain.repository;

import com.nicholas.backend.domain.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    List<Cliente> findByAtivoTrue();

    boolean existsByWhatsapp(String whatsapp);
}