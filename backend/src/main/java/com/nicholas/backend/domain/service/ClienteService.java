package com.nicholas.backend.domain.service;

import com.nicholas.backend.domain.entity.Cliente;
import com.nicholas.backend.domain.repository.ClienteRepository;
import com.nicholas.backend.dto.request.ClienteRequest;
import com.nicholas.backend.dto.response.ClienteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public List<ClienteResponse> listar() {
        return clienteRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ClienteResponse> listarAtivos() {
        return clienteRepository.findByAtivoTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ClienteResponse buscarPorId(Long id) {
        Cliente cliente = buscarEntidadePorId(id);

        return toResponse(cliente);
    }

    public ClienteResponse criar(ClienteRequest request) {
        Cliente cliente = Cliente.builder()
                .nomeCompleto(request.nomeCompleto())
                .apelido(request.apelido())
                .whatsapp(request.whatsapp())
                .build();

        Cliente clienteSalvo = clienteRepository.save(cliente);

        return toResponse(clienteSalvo);
    }

    public ClienteResponse atualizar(Long id, ClienteRequest request) {
        Cliente cliente = buscarEntidadePorId(id);

        cliente.setNomeCompleto(request.nomeCompleto());
        cliente.setApelido(request.apelido());
        cliente.setWhatsapp(request.whatsapp());

        Cliente clienteAtualizado = clienteRepository.save(cliente);

        return toResponse(clienteAtualizado);
    }

    public void remover(Long id) {
        Cliente cliente = buscarEntidadePorId(id);
        clienteRepository.delete(cliente);
    }

    public Cliente buscarEntidadePorId(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrada."));
    }

    private ClienteResponse toResponse(Cliente cliente) {
        return new ClienteResponse(
                cliente.getId(),
                cliente.getNomeCompleto(),
                cliente.getApelido(),
                cliente.getWhatsapp(),
                cliente.getAtivo()
        );
    }
}