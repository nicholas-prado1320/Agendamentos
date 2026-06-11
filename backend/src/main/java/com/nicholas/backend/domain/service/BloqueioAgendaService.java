package com.nicholas.backend.domain.service;

import com.nicholas.backend.domain.entity.Agendamento;
import com.nicholas.backend.domain.entity.BloqueioAgenda;
import com.nicholas.backend.domain.entity.StatusAgendamento;
import com.nicholas.backend.domain.repository.AgendamentoRepository;
import com.nicholas.backend.domain.repository.BloqueioAgendaRepository;
import com.nicholas.backend.dto.request.BloqueioAgendaRequest;
import com.nicholas.backend.dto.response.BloqueioAgendaResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BloqueioAgendaService {

    private static final List<StatusAgendamento> STATUS_ATIVOS = List.of(
            StatusAgendamento.AGENDADO,
            StatusAgendamento.EM_ATENDIMENTO
    );

    private final BloqueioAgendaRepository bloqueioAgendaRepository;
    private final AgendamentoRepository agendamentoRepository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    public List<BloqueioAgendaResponse> listar() {
        validarManicure();

        return bloqueioAgendaRepository.findByAtivoTrueOrderByDataInicioAscHoraInicioAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<BloqueioAgenda> buscarBloqueiosAtivosPorData(LocalDate data) {
        return bloqueioAgendaRepository
                .findByAtivoTrueAndDataInicioLessThanEqualAndDataFimGreaterThanEqual(data, data);
    }

    @Transactional
    public BloqueioAgendaResponse criar(BloqueioAgendaRequest request) {
        validarManicure();
        validarRequest(request);
        validarSemAgendamentosAtivosNoPeriodo(request);

        BloqueioAgenda bloqueio = BloqueioAgenda.builder()
                .dataInicio(request.dataInicio())
                .dataFim(request.dataFim() == null ? request.dataInicio() : request.dataFim())
                .horaInicio(Boolean.TRUE.equals(request.diaInteiro()) ? null : request.horaInicio())
                .horaFim(Boolean.TRUE.equals(request.diaInteiro()) ? null : request.horaFim())
                .diaInteiro(Boolean.TRUE.equals(request.diaInteiro()))
                .motivo(request.motivo().trim())
                .ativo(true)
                .build();

        return toResponse(bloqueioAgendaRepository.save(bloqueio));
    }

    @Transactional
    public void excluir(Long id) {
        validarManicure();

        BloqueioAgenda bloqueio = bloqueioAgendaRepository
                .findById(id)
                .orElseThrow(() -> new RuntimeException("Bloqueio de agenda não encontrado."));

        bloqueio.setAtivo(false);

        bloqueioAgendaRepository.save(bloqueio);
    }

    private void validarRequest(BloqueioAgendaRequest request) {
        LocalDate dataFim = request.dataFim() == null ? request.dataInicio() : request.dataFim();
        boolean diaInteiro = Boolean.TRUE.equals(request.diaInteiro());

        if (dataFim.isBefore(request.dataInicio())) {
            throw new RuntimeException("A data final não pode ser anterior à data inicial.");
        }

        if (!diaInteiro) {
            if (request.horaInicio() == null || request.horaFim() == null) {
                throw new RuntimeException("Informe hora de início e fim para bloqueios parciais.");
            }

            if (!request.horaInicio().isBefore(request.horaFim())) {
                throw new RuntimeException("A hora inicial deve ser menor que a hora final.");
            }
        }
    }

    private void validarSemAgendamentosAtivosNoPeriodo(BloqueioAgendaRequest request) {
        LocalDate dataAtual = request.dataInicio();
        LocalDate dataFim = request.dataFim() == null ? request.dataInicio() : request.dataFim();

        while (!dataAtual.isAfter(dataFim)) {
            List<Agendamento> agendamentos = agendamentoRepository
                    .findByDataAndStatusInOrderByHoraAsc(dataAtual, STATUS_ATIVOS);

            boolean possuiConflito = agendamentos.stream()
                    .anyMatch((agendamento) -> conflitoComAgendamento(request, agendamento));

            if (possuiConflito) {
                throw new RuntimeException("Existem agendamentos ativos neste período. Cancele, reagende ou conclua esses atendimentos antes de bloquear a agenda.");
            }

            dataAtual = dataAtual.plusDays(1);
        }
    }

    private boolean conflitoComAgendamento(BloqueioAgendaRequest request, Agendamento agendamento) {
        if (Boolean.TRUE.equals(request.diaInteiro())) {
            return true;
        }

        int inicioBloqueio = toMinutos(request.horaInicio());
        int fimBloqueio = toMinutos(request.horaFim());

        int inicioAgendamento = toMinutos(agendamento.getHora());
        int fimAgendamento = inicioAgendamento + converterDuracaoParaMinutos(agendamento.getServico().getDuracao());

        return inicioAgendamento < fimBloqueio && fimAgendamento > inicioBloqueio;
    }

    private int toMinutos(LocalTime hora) {
        return hora.getHour() * 60 + hora.getMinute();
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

    private void validarManicure() {
        if (usuarioAutenticadoService.isCliente()) {
            throw new RuntimeException("Cliente não pode gerenciar bloqueios de agenda.");
        }
    }

    private BloqueioAgendaResponse toResponse(BloqueioAgenda bloqueio) {
        return new BloqueioAgendaResponse(
                bloqueio.getId(),
                bloqueio.getDataInicio(),
                bloqueio.getDataFim(),
                bloqueio.getHoraInicio(),
                bloqueio.getHoraFim(),
                bloqueio.getDiaInteiro(),
                bloqueio.getMotivo(),
                bloqueio.getAtivo()
        );
    }
}