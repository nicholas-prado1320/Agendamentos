package com.nicholas.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record PushSubscriptionKeysRequest(
        @NotBlank(message = "A chave p256dh é obrigatória.")
        String p256dh,

        @NotBlank(message = "A chave auth é obrigatória.")
        String auth
) {
}