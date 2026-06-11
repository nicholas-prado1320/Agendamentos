package com.nicholas.backend.dto.response;

import java.time.DayOfWeek;
import java.time.LocalTime;

public record HorarioAtendimentoResponse(
        Long id,
        DayOfWeek diaSemana,
        LocalTime horaInicio,
        LocalTime horaFim,
        Boolean ativo,
        Boolean atendimento24h
) {
}