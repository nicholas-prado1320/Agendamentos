package com.nicholas.backend.dto.response;

import java.time.LocalDate;
import java.time.LocalTime;

public record BloqueioAgendaResponse(
        Long id,
        LocalDate dataInicio,
        LocalDate dataFim,
        LocalTime horaInicio,
        LocalTime horaFim,
        Boolean diaInteiro,
        String motivo,
        Boolean ativo
) {
}