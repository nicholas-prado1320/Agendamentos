package com.nicholas.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ManicureRegisterRequest(
        @NotBlank(message = "O nome é obrigatório.")
        String nome,

        @NotBlank(message = "O e-mail é obrigatório.")
        @Email(message = "Informe um e-mail válido.")
        String email,

        @NotBlank(message = "A senha é obrigatória.")
        @Size(min = 6, message = "A senha deve ter pelo menos 6 caracteres.")
        String senha
) {
}