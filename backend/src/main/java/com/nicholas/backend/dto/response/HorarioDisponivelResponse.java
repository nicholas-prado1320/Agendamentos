package com.nicholas.backend.dto.response;

public record HorarioDisponivelResponse(
        String hora,
        Boolean disponivel
) {
}