package com.nicholas.backend.controller;

import com.nicholas.backend.domain.service.AuthService;
import com.nicholas.backend.dto.request.ClienteRegisterRequest;
import com.nicholas.backend.dto.request.LoginRequest;
import com.nicholas.backend.dto.response.AuthResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
    public AuthResponse registrarCliente(@RequestBody @Valid ClienteRegisterRequest request) {
        return authService.registrarCliente(request);
    }
}