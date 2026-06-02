package com.nicholas.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClienteRegisterRequest(
        @NotBlank(message = "O nome é obrigatório.")
        @Size(max = 150, message = "O nome deve ter no máximo 150 caracteres.")
        String nomeCompleto,

        @Size(max = 80, message = "O apelido deve ter no máximo 80 caracteres.")
        String apelido,

        @NotBlank(message = "O WhatsApp é obrigatório.")
        @Size(max = 20, message = "O WhatsApp deve ter no máximo 20 caracteres.")
        String whatsapp,

        @NotBlank(message = "O e-mail é obrigatório.")
        @Email(message = "Informe um e-mail válido.")
        String email,

        @NotBlank(message = "A senha é obrigatória.")
        @Size(min = 6, message = "A senha deve ter pelo menos 6 caracteres.")
        String senha
) {
}