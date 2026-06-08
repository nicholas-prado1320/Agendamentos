package com.nicholas.backend.domain.repository;

import com.nicholas.backend.domain.entity.EmailVerificationCode;
import com.nicholas.backend.domain.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, Long> {

    Optional<EmailVerificationCode> findTopByUsuarioAndCodigoAndUtilizadoFalseOrderByDataCriacaoDesc(
            Usuario usuario,
            String codigo
    );
}