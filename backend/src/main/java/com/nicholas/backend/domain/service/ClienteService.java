package com.nicholas.backend.domain.service;

import com.nicholas.backend.domain.entity.Cliente;
import com.nicholas.backend.domain.entity.StatusAgendamento;
import com.nicholas.backend.domain.repository.AgendamentoRepository;
import com.nicholas.backend.domain.repository.ClienteRepository;
import com.nicholas.backend.dto.request.ClienteRequest;
import com.nicholas.backend.dto.response.ClienteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private static final List<StatusAgendamento> STATUS_AGENDAMENTOS_EM_ABERTO = List.of(
            StatusAgendamento.AGENDADO,
            StatusAgendamento.EM_ATENDIMENTO
    );

    private final ClienteRepository clienteRepository;
    private final AgendamentoRepository agendamentoRepository;
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

    public List<ClienteResponse> listarInativos() {
        validarManicure();

        return clienteRepository.findByAtivoFalse()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public ClienteResponse buscarPorId(Long id) {
        validarManicure();

        Cliente cliente = buscarEntidadePorId(id);

        return toResponse(cliente);
    }

    @Transactional
    public ClienteResponse criar(ClienteRequest request) {
        validarManicure();

        Cliente cliente = Cliente.builder()
                .nomeCompleto(request.nomeCompleto())
                .apelido(request.apelido())
                .whatsapp(request.whatsapp())
                .ativo(true)
                .build();

        Cliente clienteSalvo = clienteRepository.save(cliente);

        return toResponse(clienteSalvo);
    }

    @Transactional
    public ClienteResponse atualizar(Long id, ClienteRequest request) {
        validarManicure();

        Cliente cliente = buscarEntidadePorId(id);

        cliente.setNomeCompleto(request.nomeCompleto());
        cliente.setApelido(request.apelido());
        cliente.setWhatsapp(request.whatsapp());

        Cliente clienteAtualizado = clienteRepository.save(cliente);

        return toResponse(clienteAtualizado);
    }

    @Transactional
    public ClienteResponse inativar(Long id) {
        validarManicure();

        Cliente cliente = buscarEntidadePorId(id);

        if (!Boolean.TRUE.equals(cliente.getAtivo())) {
            return toResponse(cliente);
        }

        validarClienteSemAgendamentosEmAberto(id);

        cliente.setAtivo(false);

        return toResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteResponse ativar(Long id) {
        validarManicure();

        Cliente cliente = buscarEntidadePorId(id);

        if (Boolean.TRUE.equals(cliente.getAtivo())) {
            return toResponse(cliente);
        }

        cliente.setAtivo(true);

        return toResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public void removerDefinitivo(Long id) {
        validarManicure();

        Cliente cliente = buscarEntidadePorId(id);

        validarClienteSemNenhumAgendamento(id);

        clienteRepository.delete(cliente);
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

    private void validarClienteSemAgendamentosEmAberto(Long clienteId) {
        boolean possuiAgendamentoEmAberto = agendamentoRepository.existsByClienteIdAndStatusIn(
                clienteId,
                STATUS_AGENDAMENTOS_EM_ABERTO
        );

        if (possuiAgendamentoEmAberto) {
            throw new RuntimeException("Não é possível inativar esta cliente, pois ela possui agendamentos em aberto.");
        }
    }

    private void validarClienteSemNenhumAgendamento(Long clienteId) {
        boolean possuiAgendamento = agendamentoRepository.existsByClienteId(clienteId);

        if (possuiAgendamento) {
            throw new RuntimeException("Não é possível excluir definitivamente esta cliente, pois ela possui histórico de agendamentos.");
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