package com.nicholas.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record BloqueioAgendaRequest(
        @NotNull(message = "A data inicial é obrigatória.")
        LocalDate dataInicio,

        LocalDate dataFim,

        LocalTime horaInicio,

        LocalTime horaFim,

        Boolean diaInteiro,

        @NotBlank(message = "O motivo é obrigatório.")
        String motivo
) {
}