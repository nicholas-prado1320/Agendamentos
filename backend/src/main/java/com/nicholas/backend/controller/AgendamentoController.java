package com.nicholas.backend.controller;

import com.nicholas.backend.domain.service.AgendamentoService;
import com.nicholas.backend.dto.request.AgendamentoRequest;
import com.nicholas.backend.dto.response.AgendamentoResponse;
import com.nicholas.backend.dto.response.HorarioDisponivelResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.nicholas.backend.domain.entity.StatusAgendamento;
import com.nicholas.backend.dto.response.PageResponse;
import java.math.BigDecimal;
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

    @GetMapping("/filtro")
    public PageResponse<AgendamentoResponse> filtrar(
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) StatusAgendamento status,
            @RequestParam(defaultValue = "false") boolean todosStatus,
            @RequestParam(required = false) Long clienteId,
            @RequestParam(required = false) Long servicoId,
            @RequestParam(required = false) LocalDate dataInicio,
            @RequestParam(required = false) LocalDate dataFim,
            @RequestParam(required = false) BigDecimal valorMinimo,
            @RequestParam(required = false) BigDecimal valorMaximo,
            @RequestParam(required = false) String busca,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size
    ) {
        return agendamentoService.filtrar(
                tipo,
                status,
                todosStatus,
                clienteId,
                servicoId,
                dataInicio,
                dataFim,
                valorMinimo,
                valorMaximo,
                busca,
                page,
                size
        );
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

    @GetMapping("/pendencias")
    public List<AgendamentoResponse> listarPendencias() {
        return agendamentoService.listarPendencias();
    }

    @PatchMapping("/{id}/iniciar")
    public AgendamentoResponse iniciar(@PathVariable Long id) {
        return agendamentoService.iniciar(id);
    }

    @PatchMapping("/{id}/nao-compareceu")
    public AgendamentoResponse marcarClienteNaoCompareceu(@PathVariable Long id) {
        return agendamentoService.marcarClienteNaoCompareceu(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remover(@PathVariable Long id) {
        agendamentoService.remover(id);
    }
}