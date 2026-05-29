package com.nicholas.backend.domain.service;

import com.nicholas.backend.domain.entity.Agendamento;
import com.nicholas.backend.domain.entity.Cliente;
import com.nicholas.backend.domain.entity.Servico;
import com.nicholas.backend.domain.entity.StatusAgendamento;
import com.nicholas.backend.domain.repository.AgendamentoRepository;
import com.nicholas.backend.dto.request.AgendamentoRequest;
import com.nicholas.backend.dto.response.AgendamentoResponse;
import com.nicholas.backend.dto.response.ClienteResumoResponse;
import com.nicholas.backend.dto.response.ServicoResumoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;
    private final ClienteService clienteService;
    private final ServicoService servicoService;

    public List<AgendamentoResponse> listar() {
        if (usuarioAutenticadoService.isCliente()) {
            Long clienteId = usuarioAutenticadoService.getClienteId();

            if (clienteId == null) {
                throw new RuntimeException("Usuário cliente não possui cadastro de cliente vinculado.");
            }

            return agendamentoRepository.findByClienteIdOrderByDataAscHoraAsc(clienteId)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        return agendamentoRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AgendamentoResponse> listarHoje() {
        LocalDate hoje = LocalDate.now();

        if (usuarioAutenticadoService.isCliente()) {
            Long clienteId = usuarioAutenticadoService.getClienteId();

            if (clienteId == null) {
                throw new RuntimeException("Usuário cliente não possui cadastro de cliente vinculado.");
            }

            return agendamentoRepository.findByClienteIdAndDataOrderByHoraAsc(clienteId, hoje)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        return agendamentoRepository.findByDataOrderByHoraAsc(hoje)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AgendamentoResponse> listarSemana() {
        LocalDate hoje = LocalDate.now();

        LocalDate inicioSemana = hoje.with(DayOfWeek.MONDAY);
        LocalDate fimSemana = hoje.with(DayOfWeek.SUNDAY);

        if (usuarioAutenticadoService.isCliente()) {
            Long clienteId = usuarioAutenticadoService.getClienteId();

            if (clienteId == null) {
                throw new RuntimeException("Usuário cliente não possui cadastro de cliente vinculado.");
            }

            return agendamentoRepository
                    .findByClienteIdAndDataBetweenOrderByDataAscHoraAsc(
                            clienteId,
                            inicioSemana,
                            fimSemana
                    )
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        return agendamentoRepository
                .findByDataBetweenOrderByDataAscHoraAsc(inicioSemana, fimSemana)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public AgendamentoResponse criar(AgendamentoRequest request) {
        Cliente cliente;

        if (usuarioAutenticadoService.isCliente()) {
            Long clienteId = usuarioAutenticadoService.getClienteId();

            if (clienteId == null) {
                throw new RuntimeException("Usuário cliente não possui cadastro de cliente vinculado.");
            }

            cliente = clienteService.buscarEntidadePorId(clienteId);
        } else {
            cliente = clienteService.buscarEntidadePorId(request.clienteId());
        }

        Servico servico = servicoService.buscarEntidadePorId(request.servicoId());

        if (!Boolean.TRUE.equals(cliente.getAtivo())) {
            throw new RuntimeException("A cliente selecionada está inativa.");
        }

        if (!Boolean.TRUE.equals(servico.getAtivo())) {
            throw new RuntimeException("O serviço selecionado está inativo.");
        }

        validarConflitoDeHorario(request, servico);

        Agendamento agendamento = Agendamento.builder()
                .cliente(cliente)
                .servico(servico)
                .data(request.data())
                .hora(request.hora())
                .build();

        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamento);

        return toResponse(agendamentoSalvo);
    }

    public AgendamentoResponse concluir(Long id) {
        if (usuarioAutenticadoService.isCliente()) {
            throw new RuntimeException("Cliente não pode concluir agendamento.");
        }

        Agendamento agendamento = buscarEntidadePorId(id);

        agendamento.setStatus(StatusAgendamento.CONCLUIDO);

        return toResponse(agendamentoRepository.save(agendamento));
    }

    public AgendamentoResponse cancelar(Long id) {
        Agendamento agendamento = buscarEntidadePorId(id);

        validarPermissaoSobreAgendamento(agendamento);

        agendamento.setStatus(StatusAgendamento.CANCELADO);

        return toResponse(agendamentoRepository.save(agendamento));
    }

    public void remover(Long id) {
        Agendamento agendamento = buscarEntidadePorId(id);

        validarPermissaoSobreAgendamento(agendamento);

        agendamento.setStatus(StatusAgendamento.CANCELADO);

        agendamentoRepository.save(agendamento);
    }

    private Agendamento buscarEntidadePorId(Long id) {
        return agendamentoRepository.findById(id).orElseThrow(() -> new RuntimeException("Agendamento não encontrado."));
    }

    private void validarPermissaoSobreAgendamento(Agendamento agendamento) {
        if (!usuarioAutenticadoService.isCliente()) {
            return;
        }

        Long clienteLogadoId = usuarioAutenticadoService.getClienteId();

        if (!agendamento.getCliente().getId().equals(clienteLogadoId)) {
            throw new RuntimeException("Você não tem permissão para acessar este agendamento.");
        }
    }

    private void validarConflitoDeHorario(AgendamentoRequest request, Servico servicoNovo) {
        LocalTime inicioNovo = request.hora();
        LocalTime fimNovo = inicioNovo.plusMinutes(converterDuracaoParaMinutos(servicoNovo.getDuracao()));

        List<Agendamento> agendamentosDoDia = agendamentoRepository.findByDataAndStatus(
                request.data(),
                StatusAgendamento.AGENDADO
        );

        boolean existeConflito = agendamentosDoDia.stream()
                .anyMatch((agendamentoExistente) -> {
                    LocalTime inicioExistente = agendamentoExistente.getHora();
                    LocalTime fimExistente = inicioExistente.plusMinutes(
                            converterDuracaoParaMinutos(agendamentoExistente.getServico().getDuracao())
                    );

                    return inicioNovo.isBefore(fimExistente) && inicioExistente.isBefore(fimNovo);
                });

        if (existeConflito) {
            throw new RuntimeException("Já existe um agendamento ativo nesse intervalo de horário.");
        }
    }

    private int converterDuracaoParaMinutos(String duracao) {
        if (duracao == null || duracao.isBlank()) {
            throw new RuntimeException("A duração do serviço é inválida.");
        }

        String valor = duracao.toLowerCase().trim();

        int minutos = 0;

        if (valor.contains("h")) {
            String[] partesHora = valor.split("h");

            String horaTexto = partesHora[0].replaceAll("[^0-9]", "");

            if (!horaTexto.isBlank()) {
                minutos += Integer.parseInt(horaTexto) * 60;
            }

            if (partesHora.length > 1) {
                String minutoTexto = partesHora[1].replaceAll("[^0-9]", "");

                if (!minutoTexto.isBlank()) {
                    minutos += Integer.parseInt(minutoTexto);
                }
            }

            return minutos;
        }

        String minutoTexto = valor.replaceAll("[^0-9]", "");

        if (!minutoTexto.isBlank()) {
            return Integer.parseInt(minutoTexto);
        }

        throw new RuntimeException("A duração do serviço é inválida.");
    }

    private AgendamentoResponse toResponse(Agendamento agendamento) {
        return new AgendamentoResponse(
                agendamento.getId(),
                new ClienteResumoResponse(
                        agendamento.getCliente().getId(),
                        agendamento.getCliente().getNomeCompleto(),
                        agendamento.getCliente().getApelido()
                ),
                new ServicoResumoResponse(
                        agendamento.getServico().getId(),
                        agendamento.getServico().getNome(),
                        agendamento.getServico().getPreco()
                ),
                agendamento.getData(),
                agendamento.getHora(),
                agendamento.getStatus()
        );
    }
}