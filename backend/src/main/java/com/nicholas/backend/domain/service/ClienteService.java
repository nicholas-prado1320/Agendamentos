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
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    public List<ClienteResponse> listar() {
        validarManicure();

        return clienteRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ClienteResponse> listarAtivos() {
        validarManicure();

        return clienteRepository.findByAtivoTrue()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ClienteResponse buscarPorId(Long id) {
        validarManicure();
        Cliente cliente = buscarEntidadePorId(id);

        return toResponse(cliente);
    }

    public ClienteResponse criar(ClienteRequest request) {
        validarManicure();
        Cliente cliente = Cliente.builder()
                .nomeCompleto(request.nomeCompleto())
                .apelido(request.apelido())
                .whatsapp(request.whatsapp())
                .build();

        Cliente clienteSalvo = clienteRepository.save(cliente);

        return toResponse(clienteSalvo);
    }

    public ClienteResponse atualizar(Long id, ClienteRequest request) {
        validarManicure();
        Cliente cliente = buscarEntidadePorId(id);

        cliente.setNomeCompleto(request.nomeCompleto());
        cliente.setApelido(request.apelido());
        cliente.setWhatsapp(request.whatsapp());

        Cliente clienteAtualizado = clienteRepository.save(cliente);

        return toResponse(clienteAtualizado);
    }

    public void remover(Long id) {
        validarManicure();
        Cliente cliente = buscarEntidadePorId(id);
        cliente.setAtivo(false);
        clienteRepository.save(cliente);
    }

    public Cliente buscarEntidadePorId(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrada."));
    }

    private void validarManicure() {
        if (!usuarioAutenticadoService.isManicure()) {
            throw new RuntimeException("Você não tem permissão para realizar esta ação.");
        }
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