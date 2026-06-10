package com.nicholas.backend.dto.response;

public record ClienteResponse(
        Long id,
        String nomeCompleto,
        String apelido,
        String whatsapp,
        Boolean ativo,
        Long totalAgendamentos,
        Long totalConcluidos,
        Long totalCancelados,
        Long totalNaoCompareceu
) {
}