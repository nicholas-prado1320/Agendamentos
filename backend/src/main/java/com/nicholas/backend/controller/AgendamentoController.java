package com.nicholas.backend.controller;

import com.nicholas.backend.domain.service.AgendamentoService;
import com.nicholas.backend.dto.request.AgendamentoRequest;
import com.nicholas.backend.dto.response.AgendamentoResponse;
import com.nicholas.backend.dto.response.HorarioDisponivelResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/agendamentos")
@RequiredArgsConstructor
public class AgendamentoController {

    private final AgendamentoService agendamentoService;

    @GetMapping
    public List<AgendamentoResponse> listar() {
        return agendamentoService.listar();
    }

    @GetMapping("/hoje")
    public List<AgendamentoResponse> listarHoje() {
        return agendamentoService.listarHoje();
    }

    @GetMapping("/semana")
    public List<AgendamentoResponse> listarSemana() {
        return agendamentoService.listarSemana();
    }

    @GetMapping("/horarios-disponiveis")
    public List<HorarioDisponivelResponse> listarHorariosDisponiveis(
            @RequestParam Long servicoId,
            @RequestParam LocalDate data
    ) {
        return agendamentoService.listarHorariosDisponiveis(servicoId, data);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AgendamentoResponse criar(@RequestBody @Valid AgendamentoRequest request) {
        return agendamentoService.criar(request);
    }

    @PatchMapping("/{id}/concluir")
    public AgendamentoResponse concluir(@PathVariable Long id) {
        return agendamentoService.concluir(id);
    }

    @PatchMapping("/{id}/cancelar")
    public AgendamentoResponse cancelar(@PathVariable Long id) {
        return agendamentoService.cancelar(id);
    }

    @GetMapping("/historico")
    public List<AgendamentoResponse> listarHistorico() {
        return agendamentoService.listarHistorico();
    }

    @PatchMapping("/{id}/iniciar")
    public AgendamentoResponse iniciar(@PathVariable Long id) {
        return agendamentoService.iniciar(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable Long id) {
        agendamentoService.remover(id);
    }
}