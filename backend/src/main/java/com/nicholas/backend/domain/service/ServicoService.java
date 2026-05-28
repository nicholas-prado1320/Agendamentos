package com.nicholas.backend.domain.service;

import com.nicholas.backend.domain.entity.Servico;
import com.nicholas.backend.domain.repository.ServicoRepository;
import com.nicholas.backend.dto.request.ServicoRequest;
import com.nicholas.backend.dto.response.ServicoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServicoService {

    private final ServicoRepository servicoRepository;

    public List<ServicoResponse> listar() {
        return servicoRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ServicoResponse> listarAtivos() {
        return servicoRepository.findByAtivoTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ServicoResponse buscarPorId(Long id) {
        Servico servico = buscarEntidadePorId(id);

        return toResponse(servico);
    }

    public ServicoResponse criar(ServicoRequest request) {
        Servico servico = Servico.builder()
                .nome(request.nome())
                .descricao(request.descricao())
                .duracao(request.duracao())
                .preco(request.preco())
                .build();

        Servico servicoSalvo = servicoRepository.save(servico);

        return toResponse(servicoSalvo);
    }

    public ServicoResponse atualizar(Long id, ServicoRequest request) {
        Servico servico = buscarEntidadePorId(id);

        servico.setNome(request.nome());
        servico.setDescricao(request.descricao());
        servico.setDuracao(request.duracao());
        servico.setPreco(request.preco());

        Servico servicoAtualizado = servicoRepository.save(servico);

        return toResponse(servicoAtualizado);
    }

    public ServicoResponse ativar(Long id) {
        Servico servico = buscarEntidadePorId(id);

        servico.setAtivo(true);

        return toResponse(servicoRepository.save(servico));
    }

    public ServicoResponse inativar(Long id) {
        Servico servico = buscarEntidadePorId(id);

        servico.setAtivo(false);

        return toResponse(servicoRepository.save(servico));
    }

    public Servico buscarEntidadePorId(Long id) {
        return servicoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Serviço não encontrado."));
    }

    private ServicoResponse toResponse(Servico servico) {
        return new ServicoResponse(
                servico.getId(),
                servico.getNome(),
                servico.getDescricao(),
                servico.getDuracao(),
                servico.getPreco(),
                servico.getAtivo()
        );
    }
}