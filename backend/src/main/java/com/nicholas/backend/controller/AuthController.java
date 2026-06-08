package com.nicholas.backend.controller;

import com.nicholas.backend.domain.entity.Usuario;
import com.nicholas.backend.domain.service.AuthService;
import com.nicholas.backend.dto.request.AlterarSenhaRequest;
import com.nicholas.backend.dto.request.ClienteRegisterRequest;
import com.nicholas.backend.dto.request.EsqueciSenhaRequest;
import com.nicholas.backend.dto.request.LoginRequest;
import com.nicholas.backend.dto.request.ValidarEmailRequest;
import com.nicholas.backend.dto.request.ReenviarCodigoEmailRequest;
import com.nicholas.backend.dto.request.GoogleCompletarCadastroRequest;
import com.nicholas.backend.dto.request.GoogleLoginRequest;
import com.nicholas.backend.dto.response.GoogleAuthResponse;
import com.nicholas.backend.dto.response.AuthResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public AuthResponse login(@RequestBody @Valid LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/register-cliente")
    public void registrarCliente(@RequestBody @Valid ClienteRegisterRequest request) {
        authService.registrarCliente(request);
    }

    @PostMapping("/google")
    public GoogleAuthResponse loginGoogle(@RequestBody @Valid GoogleLoginRequest request) {
        return authService.loginGoogle(request);
    }

    @PostMapping("/google/completar-cadastro")
    public AuthResponse completarCadastroGoogle(@RequestBody @Valid GoogleCompletarCadastroRequest request) {
        return authService.completarCadastroGoogle(request);
    }

    @PostMapping("/validar-email")
    public AuthResponse validarEmail(@RequestBody @Valid ValidarEmailRequest request) {
        return authService.validarEmail(request);
    }

    @PostMapping("/reenviar-codigo-email")
    public void reenviarCodigoEmail(@RequestBody @Valid ReenviarCodigoEmailRequest request) {
        authService.reenviarCodigoEmail(request);
    }

    @PostMapping("/esqueci-senha")
    public void esqueciSenha(@RequestBody @Valid EsqueciSenhaRequest request) {
        authService.esqueciSenha(request);
    }
}