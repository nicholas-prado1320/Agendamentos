package com.nicholas.backend.dto.response;

import java.math.BigDecimal;

public record ServicoResponse(
        Long id,
        String nome,
        String descricao,
        String duracao,
        BigDecimal preco,
        Boolean ativo
) {
}