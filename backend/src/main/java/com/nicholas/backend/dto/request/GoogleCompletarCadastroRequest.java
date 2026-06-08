package com.nicholas.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record GoogleCompletarCadastroRequest(

        @NotBlank(message = "Credential do Google é obrigatório.")
        String credential,

        @NotBlank(message = "WhatsApp é obrigatório.")
        String whatsapp
) {
}