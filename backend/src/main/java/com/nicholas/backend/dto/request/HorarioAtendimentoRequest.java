package com.nicholas.backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record HorarioAtendimentoRequest(
        @NotNull(message = "O dia da semana é obrigatório.")
        DayOfWeek diaSemana,

        LocalTime horaInicio,

        LocalTime horaFim,

        Boolean ativo,

        Boolean atendimento24h
) {
}