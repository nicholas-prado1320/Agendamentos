package com.nicholas.backend.dto.request;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record AgendamentoRequest(
        @NotNull(message = "A cliente é obrigatória.")
        Long clienteId,

        @NotNull(message = "O serviço é obrigatório.")
        Long servicoId,

        @NotNull(message = "A data é obrigatória.")
        LocalDate data,

        @NotNull(message = "A hora é obrigatória.")
        LocalTime hora
) {
}