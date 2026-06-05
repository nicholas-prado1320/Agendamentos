package com.nicholas.backend.domain.service;

import com.nicholas.backend.domain.entity.Agendamento;
import com.nicholas.backend.domain.entity.Cliente;
import com.nicholas.backend.domain.entity.HorarioAtendimento;
import com.nicholas.backend.domain.entity.Servico;
import com.nicholas.backend.domain.entity.StatusAgendamento;
import com.nicholas.backend.domain.repository.AgendamentoRepository;
import com.nicholas.backend.dto.request.AgendamentoRequest;
import com.nicholas.backend.dto.response.AgendamentoResponse;
import com.nicholas.backend.dto.response.ClienteResumoResponse;
import com.nicholas.backend.dto.response.HorarioDisponivelResponse;
import com.nicholas.backend.dto.response.ServicoResumoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgendamentoService {

    private static final int INTERVALO_GRADE_MINUTOS = 15;

    private static final List<StatusAgendamento> STATUS_ATIVOS = List.of(
            StatusAgendamento.AGENDADO,
            StatusAgendamento.EM_ATENDIMENTO
    );

    private static final List<StatusAgendamento> STATUS_HISTORICO = List.of(
            StatusAgendamento.CONCLUIDO,
            StatusAgendamento.CANCELADO,
            StatusAgendamento.EXCLUIDO
    );

    private final AgendamentoRepository agendamentoRepository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;
    private final ClienteService clienteService;
    private final ServicoService servicoService;
    private final HorarioAtendimentoService horarioAtendimentoService;

    public List<AgendamentoResponse> listar() {
        if (usuarioAutenticadoService.isCliente()) {
            Long clienteId = usuarioAutenticadoService.getClienteId();

            if (clienteId == null) {
                throw new RuntimeException("Cliente não possui cadastro vinculado.");
            }

            return agendamentoRepository
                    .findByClienteIdAndStatusInOrderByDataAscHoraAsc(clienteId, STATUS_ATIVOS)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        return agendamentoRepository
                .findByStatusInOrderByDataAscHoraAsc(STATUS_ATIVOS)
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

            return agendamentoRepository
                    .findByClienteIdAndDataAndStatusInOrderByHoraAsc(clienteId, hoje, STATUS_ATIVOS)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        return agendamentoRepository
                .findByDataAndStatusInOrderByHoraAsc(hoje, STATUS_ATIVOS)
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
                    .findByClienteIdAndDataBetweenAndStatusInOrderByDataAscHoraAsc(
                            clienteId,
                            inicioSemana,
                            fimSemana,
                            STATUS_ATIVOS
                    )
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        return agendamentoRepository
                .findByDataBetweenAndStatusInOrderByDataAscHoraAsc(
                        inicioSemana,
                        fimSemana,
                        STATUS_ATIVOS
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AgendamentoResponse> listarHistorico() {
        if (usuarioAutenticadoService.isCliente()) {
            Long clienteId = usuarioAutenticadoService.getClienteId();

            if (clienteId == null) {
                throw new RuntimeException("Usuário cliente não possui cadastro de cliente vinculado.");
            }

            return agendamentoRepository
                    .findByClienteIdAndStatusInOrderByDataAscHoraAsc(clienteId, STATUS_HISTORICO)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }

        return agendamentoRepository
                .findByStatusInOrderByDataAscHoraAsc(STATUS_HISTORICO)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<HorarioDisponivelResponse> listarHorariosDisponiveis(Long servicoId, LocalDate data) {
        Servico servico = servicoService.buscarEntidadePorId(servicoId);

        if (!Boolean.TRUE.equals(servico.getAtivo())) {
            throw new RuntimeException("O serviço selecionado está inativo.");
        }

        if (data.isBefore(LocalDate.now())) {
            throw new RuntimeException("Não é possível listar horários para uma data passada.");
        }

        int duracaoServico = converterDuracaoParaMinutos(servico.getDuracao());
        validarDuracaoMultiplaDaGrade(duracaoServico);

        HorarioAtendimento horarioAtendimento = horarioAtendimentoService.buscarHorarioAtivoPorDia(
                data.getDayOfWeek()
        );

        LocalTime inicioExpediente = horarioAtendimento.getHoraInicio();
        LocalTime fimExpediente = horarioAtendimento.getHoraFim();

        List<Agendamento> agendamentosDoDia = agendamentoRepository.findByDataAndStatusInOrderByHoraAsc(
                data,
                STATUS_ATIVOS
        );

        List<HorarioDisponivelResponse> horarios = new ArrayList<>();

        LocalTime horarioAtual = inicioExpediente;

        while (!horarioAtual.plusMinutes(duracaoServico).isAfter(fimExpediente)) {
            boolean disponivel = horarioEstaDisponivel(
                    horarioAtual,
                    duracaoServico,
                    fimExpediente,
                    data,
                    agendamentosDoDia
            );

            horarios.add(new HorarioDisponivelResponse(
                    horarioAtual.toString(),
                    disponivel
            ));

            horarioAtual = horarioAtual.plusMinutes(INTERVALO_GRADE_MINUTOS);
        }

        return horarios;
    }

    @Transactional
    public AgendamentoResponse criar(AgendamentoRequest request) {
        Cliente cliente;

        if (usuarioAutenticadoService.isCliente()) {
            Long clienteLogadoId = usuarioAutenticadoService.getClienteId();

            if (clienteLogadoId == null) {
                throw new RuntimeException("Usuário cliente não possui cadastro de cliente vinculado.");
            }

            if (request.clienteId() == null) {
                throw new RuntimeException("A cliente é obrigatória.");
            }

            if (!request.clienteId().equals(clienteLogadoId)) {
                throw new RuntimeException("Você não tem permissão para criar agendamento para outra cliente.");
            }

            cliente = clienteService.buscarEntidadePorId(clienteLogadoId);
        } else {
            if (request.clienteId() == null) {
                throw new RuntimeException("A cliente é obrigatória.");
            }

            cliente = clienteService.buscarEntidadePorId(request.clienteId());
        }

        Servico servico = servicoService.buscarEntidadePorId(request.servicoId());

        if (!Boolean.TRUE.equals(cliente.getAtivo())) {
            throw new RuntimeException("A cliente selecionada está inativa.");
        }

        if (!Boolean.TRUE.equals(servico.getAtivo())) {
            throw new RuntimeException("O serviço selecionado está inativo.");
        }

        validarDataHoraFutura(request.data(), request.hora());
        validarHoraNaGrade(request.hora());
        validarDuracaoMultiplaDaGrade(converterDuracaoParaMinutos(servico.getDuracao()));
        validarConflitoDeHorario(request, servico);

        Agendamento agendamento = Agendamento.builder()
                .cliente(cliente)
                .servico(servico)
                .data(request.data())
                .hora(request.hora())
                .status(StatusAgendamento.AGENDADO)
                .build();

        Agendamento agendamentoSalvo = agendamentoRepository.save(agendamento);

        return toResponse(agendamentoSalvo);
    }

    @Transactional
    public AgendamentoResponse iniciar(Long id) {
        if (usuarioAutenticadoService.isCliente()) {
            throw new RuntimeException("Cliente não pode iniciar atendimento.");
        }

        Agendamento agendamento = buscarEntidadePorId(id);

        if (agendamento.getStatus() != StatusAgendamento.AGENDADO) {
            throw new RuntimeException("Somente agendamentos agendados podem ser iniciados.");
        }

        LocalDate hoje = LocalDate.now();
        LocalTime agora = LocalTime.now();

        if (!agendamento.getData().isEqual(hoje)) {
            throw new RuntimeException("Este atendimento só pode ser iniciado na data agendada.");
        }

        if (agendamento.getHora().isAfter(agora)) {
            throw new RuntimeException("Este atendimento ainda não pode ser iniciado antes do horário agendado.");
        }

        agendamento.setStatus(StatusAgendamento.EM_ATENDIMENTO);

        return toResponse(agendamentoRepository.save(agendamento));
    }

    @Transactional
    public AgendamentoResponse concluir(Long id) {
        if (usuarioAutenticadoService.isCliente()) {
            throw new RuntimeException("Cliente não pode concluir agendamento.");
        }

        Agendamento agendamento = buscarEntidadePorId(id);

        if (agendamento.getStatus() != StatusAgendamento.EM_ATENDIMENTO) {
            throw new RuntimeException("O atendimento precisa ser iniciado antes de ser concluído.");
        }

        agendamento.setStatus(StatusAgendamento.CONCLUIDO);

        return toResponse(agendamentoRepository.save(agendamento));
    }

    @Transactional
    public AgendamentoResponse cancelar(Long id) {
        Agendamento agendamento = buscarEntidadePorId(id);

        validarPermissaoSobreAgendamento(agendamento);

        if (agendamento.getStatus() != StatusAgendamento.AGENDADO) {
            throw new RuntimeException("Somente agendamentos agendados podem ser cancelados.");
        }

        agendamento.setStatus(StatusAgendamento.CANCELADO);

        return toResponse(agendamentoRepository.save(agendamento));
    }

    @Transactional
    public void remover(Long id) {
        if (usuarioAutenticadoService.isCliente()) {
            throw new RuntimeException("Cliente não pode excluir agendamento.");
        }

        Agendamento agendamento = buscarEntidadePorId(id);

        if (agendamento.getStatus() == StatusAgendamento.EXCLUIDO) {
            return;
        }

        agendamento.setStatus(StatusAgendamento.EXCLUIDO);

        agendamentoRepository.save(agendamento);
    }

    private Agendamento buscarEntidadePorId(Long id) {
        return agendamentoRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("Agendamento não encontrado."));
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

    private boolean horarioEstaDisponivel(
            LocalTime horaInicio,
            int duracaoServico,
            LocalTime fimExpediente,
            LocalDate data,
            List<Agendamento> agendamentosDoDia
    ) {
        LocalTime horaFim = horaInicio.plusMinutes(duracaoServico);

        if (horaFim.isAfter(fimExpediente)) {
            return false;
        }

        if (data.isEqual(LocalDate.now()) && horaInicio.isBefore(LocalTime.now())) {
            return false;
        }

        return agendamentosDoDia.stream()
                .noneMatch((agendamento) -> existeConflito(
                        horaInicio,
                        horaFim,
                        agendamento
                ));
    }

    private void validarConflitoDeHorario(AgendamentoRequest request, Servico servicoNovo) {
        HorarioAtendimento horarioAtendimento = horarioAtendimentoService.buscarHorarioAtivoPorDia(
                request.data().getDayOfWeek()
        );

        LocalTime inicioNovo = request.hora();

        LocalTime fimNovo = inicioNovo.plusMinutes(
                converterDuracaoParaMinutos(servicoNovo.getDuracao())
        );

        if (inicioNovo.isBefore(horarioAtendimento.getHoraInicio()) || fimNovo.isAfter(horarioAtendimento.getHoraFim())) {
            throw new RuntimeException("O horário selecionado está fora do expediente de atendimento.");
        }

        List<Agendamento> agendamentosDoDia = agendamentoRepository.findByDataAndStatusInOrderByHoraAsc(
                request.data(),
                STATUS_ATIVOS
        );

        boolean existeConflito = agendamentosDoDia.stream()
                .anyMatch((agendamentoExistente) -> existeConflito(
                        inicioNovo,
                        fimNovo,
                        agendamentoExistente
                ));

        if (existeConflito) {
            throw new RuntimeException("Já existe um agendamento ativo nesse intervalo de horário.");
        }
    }

    private boolean existeConflito(
            LocalTime novoInicio,
            LocalTime novoFim,
            Agendamento agendamentoExistente
    ) {
        LocalTime inicioExistente = agendamentoExistente.getHora();

        LocalTime fimExistente = inicioExistente.plusMinutes(
                converterDuracaoParaMinutos(agendamentoExistente.getServico().getDuracao())
        );

        return novoInicio.isBefore(fimExistente) && novoFim.isAfter(inicioExistente);
    }

    private void validarDataHoraFutura(LocalDate data, LocalTime hora) {
        LocalDate hoje = LocalDate.now();
        LocalTime agora = LocalTime.now();

        if (data.isBefore(hoje)) {
            throw new RuntimeException("Não é possível agendar para uma data passada.");
        }

        if (data.isEqual(hoje) && hora.isBefore(agora)) {
            throw new RuntimeException("Não é possível agendar para um horário passado.");
        }
    }

    private void validarHoraNaGrade(LocalTime hora) {
        if (hora.getMinute() % INTERVALO_GRADE_MINUTOS != 0) {
            throw new RuntimeException("O horário do agendamento deve seguir a grade de 15 em 15 minutos.");
        }

        if (hora.getSecond() != 0 || hora.getNano() != 0) {
            throw new RuntimeException("O horário do agendamento deve estar no formato correto.");
        }
    }

    private void validarDuracaoMultiplaDaGrade(int duracaoServico) {
        if (duracaoServico <= 0) {
            throw new RuntimeException("A duração do serviço deve ser maior que zero.");
        }

        if (duracaoServico % INTERVALO_GRADE_MINUTOS != 0) {
            throw new RuntimeException("A duração do serviço deve ser múltipla de 15 minutos.");
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