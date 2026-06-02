package com.nicholas.backend.controller;

import com.nicholas.backend.domain.service.HorarioAtendimentoService;
import com.nicholas.backend.dto.request.HorarioAtendimentoRequest;
import com.nicholas.backend.dto.response.HorarioAtendimentoConfiguradoResponse;
import com.nicholas.backend.dto.response.HorarioAtendimentoResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/horarios-atendimento")
@RequiredArgsConstructor
public class HorarioAtendimentoController {

    private final HorarioAtendimentoService horarioAtendimentoService;

    @GetMapping
    public List<HorarioAtendimentoResponse> listar() {
        return horarioAtendimentoService.listar();
    }

    @GetMapping("/configurado")
    public HorarioAtendimentoConfiguradoResponse verificarConfiguracao() {
        return horarioAtendimentoService.verificarConfiguracao();
    }

    @PutMapping
    public List<HorarioAtendimentoResponse> salvarTodos(
            @RequestBody @Valid List<HorarioAtendimentoRequest> requests
    ) {
        return horarioAtendimentoService.salvarTodos(requests);
    }
}