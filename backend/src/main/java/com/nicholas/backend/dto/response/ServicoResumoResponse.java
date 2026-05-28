package com.nicholas.backend.dto.response;

import java.math.BigDecimal;

public record ServicoResumoResponse(
        Long id,
        String nome,
        BigDecimal preco
) {
}