package com.nicholas.backend.dto.response;

public record ClienteResumoResponse(
        Long id,
        String nomeCompleto,
        String apelido
) {
}