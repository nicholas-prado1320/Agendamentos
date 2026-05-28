package com.nicholas.backend.dto.response;

import com.nicholas.backend.domain.entity.StatusAgendamento;

import java.time.LocalDate;
import java.time.LocalTime;

public record AgendamentoResponse(
        Long id,
        ClienteResumoResponse cliente,
        ServicoResumoResponse servico,
        LocalDate data,
        LocalTime hora,
        StatusAgendamento status
) {
}