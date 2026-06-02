package com.nicholas.backend.dto.response;

import com.nicholas.backend.domain.entity.UsuarioRole;

public record AuthResponse(
        Long id,
        String nome,
        String email,
        UsuarioRole role,
        Long clienteId,
        String token
) {
}