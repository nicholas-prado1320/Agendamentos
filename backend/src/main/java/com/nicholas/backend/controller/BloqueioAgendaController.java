package com.nicholas.backend.controller;

import com.nicholas.backend.domain.service.BloqueioAgendaService;
import com.nicholas.backend.dto.request.BloqueioAgendaRequest;
import com.nicholas.backend.dto.response.BloqueioAgendaResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bloqueios-agenda")
@RequiredArgsConstructor
public class BloqueioAgendaController {

    private final BloqueioAgendaService bloqueioAgendaService;

    @GetMapping
    public List<BloqueioAgendaResponse> listar() {
        return bloqueioAgendaService.listar();
    }

    @PostMapping
    public BloqueioAgendaResponse criar(@RequestBody @Valid BloqueioAgendaRequest request) {
        return bloqueioAgendaService.criar(request);
    }

    @DeleteMapping("/{id}")
    public void excluir(@PathVariable Long id) {
        bloqueioAgendaService.excluir(id);
    }
}