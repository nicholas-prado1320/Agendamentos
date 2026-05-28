package com.nicholas.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClienteRequest(
        @NotBlank(message = "O nome completo é obrigatório.")
        @Size(max = 150, message = "O nome completo deve ter no máximo 150 caracteres.")
        String nomeCompleto,

        @Size(max = 80, message = "O apelido deve ter no máximo 80 caracteres.")
        String apelido,

        @NotBlank(message = "O WhatsApp é obrigatório.")
        @Size(max = 20, message = "O WhatsApp deve ter no máximo 20 caracteres.")
        String whatsapp
) {
}