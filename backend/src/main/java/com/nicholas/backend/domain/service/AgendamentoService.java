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
import com.nicholas.backend.dto.response.PageResponse;
import com.nicholas.backend.dto.response.ServicoResumoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AgendamentoService {

    private static final int INTERVALO_GRADE_MINUTOS = 15;
    private static final ZoneId ZONE_ID = ZoneId.of("America/Sao_Paulo");

    private static final List<StatusAgendamento> STATUS_ATIVOS = List.of(
            StatusAgendamento.AGENDADO,
            StatusAgendamento.EM_ATENDIMENTO
    );

    private static final List<StatusAgendamento> STATUS_HISTORICO = List.of(
            StatusAgendamento.CONCLUIDO,
            StatusAgendamento.CANCELADO,
            StatusAgendamento.NAO_COMPARECEU,
            StatusAgendamento.EXCLUIDO
    );

    private final AgendamentoRepository agendamentoRepository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;
    private final ClienteService clienteService;
    private final ServicoService servicoService;
    private final HorarioAtendimentoService horarioAtendimentoService;

    private LocalDate dataAtual() {
        return LocalDate.now(ZONE_ID);
    }

    private LocalTime horaAtual() {
        return LocalTime.now(ZONE_ID);
    }

    private LocalDateTime dataHoraAtual() {
        return LocalDateTime.now(ZONE_ID);
    }

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
        LocalDate hoje = dataAtual();

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
        LocalDate hoje = dataAtual();
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

        if (data.isBefore(dataAtual())) {
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

    public List<AgendamentoResponse> listarPendencias() {
        if (usuarioAutenticadoService.isCliente()) {
            throw new RuntimeException("Cliente não pode consultar pendências da agenda.");
        }

        return agendamentoRepository
                .findByStatusInOrderByDataDescHoraDesc(STATUS_ATIVOS)
                .stream()
                .filter(this::passouDoFimPrevisto)
                .map(this::toResponse)
                .toList();
    }

    public PageResponse<AgendamentoResponse> filtrar(
            String tipo,
            StatusAgendamento status,
            boolean todosStatus,
            Long clienteId,
            Long servicoId,
            LocalDate dataInicio,
            LocalDate dataFim,
            BigDecimal valorMinimo,
            BigDecimal valorMaximo,
            String busca,
            int page,
            int size
    ) {
        int pagina = Math.max(page, 0);
        int tamanho = Math.min(Math.max(size, 1), 50);

        String tipoFiltro = tipo == null || tipo.isBlank()
                ? "TODOS"
                : tipo.trim().toUpperCase(Locale.ROOT);

        Long clienteIdFiltro = clienteId;

        if (usuarioAutenticadoService.isCliente()) {
            Long clienteLogadoId = usuarioAutenticadoService.getClienteId();

            if (clienteLogadoId == null) {
                throw new RuntimeException("Usuário cliente não possui cadastro de cliente vinculado.");
            }

            clienteIdFiltro = clienteLogadoId;
        }

        Long clienteIdFinal = clienteIdFiltro;

        Specification<Agendamento> specification = montarSpecificationFiltro(
                tipoFiltro,
                status,
                todosStatus,
                clienteIdFinal,
                servicoId,
                dataInicio,
                dataFim,
                valorMinimo,
                valorMaximo,
                busca
        );

        PageRequest pageRequest = PageRequest.of(
                pagina,
                tamanho,
                Sort.by(Sort.Direction.DESC, "data")
                        .and(Sort.by(Sort.Direction.DESC, "hora"))
        );

        return PageResponse.from(
                agendamentoRepository
                        .findAll(specification, pageRequest)
                        .map(this::toResponse)
        );
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

        LocalDate hoje = dataAtual();
        LocalTime agora = horaAtual();

        if (!agendamento.getData().isEqual(hoje)) {
            throw new RuntimeException("Este atendimento só pode ser iniciado na data agendada.");
        }

        if (agendamento.getHora().isAfter(agora)) {
            throw new RuntimeException("Este atendimento ainda não pode ser iniciado antes do horário agendado.");
        }

        if (passouDoFimPrevisto(agendamento)) {
            throw new RuntimeException("Este atendimento já passou do horário previsto de conclusão. Marque como concluído ou como não compareceu.");
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

        if (agendamento.getStatus() == StatusAgendamento.CONCLUIDO) {
            throw new RuntimeException("Este agendamento já foi concluído.");
        }

        if (agendamento.getStatus() == StatusAgendamento.CANCELADO
                || agendamento.getStatus() == StatusAgendamento.EXCLUIDO
                || agendamento.getStatus() == StatusAgendamento.NAO_COMPARECEU) {
            throw new RuntimeException("Este agendamento não pode ser concluído.");
        }

        boolean podeConcluir =
                agendamento.getStatus() == StatusAgendamento.EM_ATENDIMENTO
                        || (agendamento.getStatus() == StatusAgendamento.AGENDADO && passouDoFimPrevisto(agendamento));

        if (!podeConcluir) {
            throw new RuntimeException("Este atendimento ainda não pode ser concluído.");
        }

        agendamento.setStatus(StatusAgendamento.CONCLUIDO);

        return toResponse(agendamentoRepository.save(agendamento));
    }

    @Transactional
    public AgendamentoResponse marcarClienteNaoCompareceu(Long id) {
        if (usuarioAutenticadoService.isCliente()) {
            throw new RuntimeException("Cliente não pode marcar não comparecimento.");
        }

        Agendamento agendamento = buscarEntidadePorId(id);

        if (agendamento.getStatus() != StatusAgendamento.AGENDADO) {
            throw new RuntimeException("Somente agendamentos em aberto podem ser marcados como não compareceu.");
        }

        if (!passouDoFimPrevisto(agendamento)) {
            throw new RuntimeException("Este agendamento ainda não pode ser marcado como não compareceu.");
        }

        agendamento.setStatus(StatusAgendamento.NAO_COMPARECEU);

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

    private Specification<Agendamento> montarSpecificationFiltro(
            String tipo,
            StatusAgendamento status,
            boolean todosStatus,
            Long clienteId,
            Long servicoId,
            LocalDate dataInicio,
            LocalDate dataFim,
            BigDecimal valorMinimo,
            BigDecimal valorMaximo,
            String busca
    ) {
        return (root, query, criteriaBuilder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (query != null) {
                query.distinct(true);
            }

            if (clienteId != null) {
                predicates.add(criteriaBuilder.equal(root.get("cliente").get("id"), clienteId));
            }

            if (servicoId != null) {
                predicates.add(criteriaBuilder.equal(root.get("servico").get("id"), servicoId));
            }

            if (dataInicio != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("data"), dataInicio));
            }

            if (dataFim != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("data"), dataFim));
            }

            if (valorMinimo != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("servico").get("preco"), valorMinimo));
            }

            if (valorMaximo != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("servico").get("preco"), valorMaximo));
            }

            aplicarFiltroStatusOuTipo(
                    tipo,
                    status,
                    todosStatus,
                    root,
                    criteriaBuilder,
                    predicates
            );

            if (busca != null && !busca.isBlank()) {
                String termo = "%" + busca.trim().toLowerCase(Locale.ROOT) + "%";

                var clienteJoin = root.join("cliente");
                var servicoJoin = root.join("servico");

                predicates.add(
                        criteriaBuilder.or(
                                criteriaBuilder.like(criteriaBuilder.lower(clienteJoin.get("nomeCompleto")), termo),
                                criteriaBuilder.like(criteriaBuilder.lower(clienteJoin.get("apelido")), termo),
                                criteriaBuilder.like(criteriaBuilder.lower(servicoJoin.get("nome")), termo)
                        )
                );
            }

            return criteriaBuilder.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private void aplicarFiltroStatusOuTipo(
            String tipo,
            StatusAgendamento status,
            boolean todosStatus,
            jakarta.persistence.criteria.Root<Agendamento> root,
            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
            List<jakarta.persistence.criteria.Predicate> predicates
    ) {
        if (status != null) {
            predicates.add(criteriaBuilder.equal(root.get("status"), status));
            return;
        }

        if (todosStatus) {
            return;
        }

        switch (tipo) {
            case "HOJE" -> {
                predicates.add(criteriaBuilder.equal(root.get("data"), dataAtual()));
                predicates.add(root.get("status").in(STATUS_ATIVOS));
            }

            case "SEMANA" -> {
                LocalDate hoje = dataAtual();
                LocalDate inicioSemana = hoje.with(DayOfWeek.MONDAY);
                LocalDate fimSemana = hoje.with(DayOfWeek.SUNDAY);

                predicates.add(criteriaBuilder.between(root.get("data"), inicioSemana, fimSemana));
                predicates.add(root.get("status").in(STATUS_ATIVOS));
            }

            case "HISTORICO" -> predicates.add(root.get("status").in(STATUS_HISTORICO));

            case "PENDENCIAS" -> predicates.add(root.get("status").in(STATUS_ATIVOS));

            case "TODOS" -> {
                // Não aplica filtro de status.
                // Retorna todos os status.
            }

            default -> predicates.add(root.get("status").in(STATUS_ATIVOS));
        }
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

        if (data.isEqual(dataAtual()) && horaInicio.isBefore(horaAtual())) {
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
        LocalDate hoje = dataAtual();
        LocalTime agora = horaAtual();

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

    private LocalDateTime obterInicioAgendamento(Agendamento agendamento) {
        return LocalDateTime.of(
                agendamento.getData(),
                agendamento.getHora()
        );
    }

    private LocalDateTime obterFimPrevistoAgendamento(Agendamento agendamento) {
        return obterInicioAgendamento(agendamento)
                .plusMinutes(converterDuracaoParaMinutos(agendamento.getServico().getDuracao()));
    }

    private boolean passouDoFimPrevisto(Agendamento agendamento) {
        return dataHoraAtual().isAfter(obterFimPrevistoAgendamento(agendamento));
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
                        agendamento.getServico().getPreco(),
                        agendamento.getServico().getDuracao()
                ),
                agendamento.getData(),
                agendamento.getHora(),
                agendamento.getStatus()
        );
    }
}
