package com.nicholas.backend.dto.response;

public record GoogleAuthResponse(
        Boolean cadastroPendente,
        String nome,
        String email,
        AuthResponse auth
) {
}