package com.nicholas.backend.controller;

import com.nicholas.backend.domain.entity.Usuario;
import com.nicholas.backend.domain.service.AuthService;
import com.nicholas.backend.dto.request.AlterarSenhaRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final AuthService authService;

    @PostMapping("/alterar-senha")
    public void alterarSenha(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody @Valid AlterarSenhaRequest request
    ) {
        authService.alterarSenha(usuario, request);
    }
}