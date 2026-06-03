package com.nicholas.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PushSubscriptionRequest(
        @NotBlank(message = "O endpoint é obrigatório.")
        String endpoint,

        @NotNull(message = "As chaves da inscrição são obrigatórias.")
        PushSubscriptionKeysRequest keys
) {
}