package com.nicholas.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record GoogleLoginRequest(

        @NotBlank(message = "Credential do Google é obrigatório.")
        String credential
) {
}