package com.nicholas.backend.controller;

import com.nicholas.backend.domain.service.ServicoService;
import com.nicholas.backend.dto.request.ServicoRequest;
import com.nicholas.backend.dto.response.ServicoResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/servicos")
@RequiredArgsConstructor
public class ServicoController {

    private final ServicoService servicoService;

    @GetMapping
    public List<ServicoResponse> listar() {
        return servicoService.listar();
    }

    @GetMapping("/ativos")
    public List<ServicoResponse> listarAtivos() {
        return servicoService.listarAtivos();
    }

    @GetMapping("/{id}")
    public ServicoResponse buscarPorId(@PathVariable Long id) {
        return servicoService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ServicoResponse criar(@RequestBody @Valid ServicoRequest request) {
        return servicoService.criar(request);
    }

    @PutMapping("/{id}")
    public ServicoResponse atualizar(@PathVariable Long id, @RequestBody @Valid ServicoRequest request) {
        return servicoService.atualizar(id, request);
    }

    @PatchMapping("/{id}/ativar")
    public ServicoResponse ativar(@PathVariable Long id) {
        return servicoService.ativar(id);
    }

    @PatchMapping("/{id}/inativar")
    public ServicoResponse inativar(@PathVariable Long id) {
        return servicoService.inativar(id);
    }
}