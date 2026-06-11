package com.nicholas.backend.domain.service;

import com.nicholas.backend.domain.entity.HorarioAtendimento;
import com.nicholas.backend.domain.repository.HorarioAtendimentoRepository;
import com.nicholas.backend.dto.request.HorarioAtendimentoRequest;
import com.nicholas.backend.dto.response.HorarioAtendimentoConfiguradoResponse;
import com.nicholas.backend.dto.response.HorarioAtendimentoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalTime;
import java.time.DayOfWeek;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HorarioAtendimentoService {

    private final HorarioAtendimentoRepository horarioAtendimentoRepository;
    private final UsuarioAutenticadoService usuarioAutenticadoService;

    public List<HorarioAtendimentoResponse> listar() {
        return horarioAtendimentoRepository.findByOrderByDiaSemanaAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public HorarioAtendimentoConfiguradoResponse verificarConfiguracao() {
        return new HorarioAtendimentoConfiguradoResponse(
                horarioAtendimentoRepository.existsByAtivoTrue()
        );
    }

    public HorarioAtendimento buscarHorarioAtivoPorDia(DayOfWeek diaSemana) {
        return horarioAtendimentoRepository
                .findByDiaSemanaAndAtivoTrue(diaSemana)
                .orElseThrow(() -> new RuntimeException("Não há atendimento cadastrado para este dia."));
    }

    @Transactional
    public List<HorarioAtendimentoResponse> salvarTodos(List<HorarioAtendimentoRequest> requests) {
        validarManicure();

        if (requests == null || requests.isEmpty()) {
            throw new RuntimeException("Informe pelo menos um dia de atendimento.");
        }

        requests.forEach(this::validarRequest);

        horarioAtendimentoRepository.deleteAll();

        List<HorarioAtendimento> horarios = requests.stream()
                .map((request) -> {
                    boolean ativo = request.ativo() == null || request.ativo();
                    boolean atendimento24h = ativo && Boolean.TRUE.equals(request.atendimento24h());

                    return HorarioAtendimento.builder()
                            .diaSemana(request.diaSemana())
                            .horaInicio(obterHoraInicio(request, ativo, atendimento24h))
                            .horaFim(obterHoraFim(request, ativo, atendimento24h))
                            .ativo(ativo)
                            .atendimento24h(atendimento24h)
                            .build();
                })
                .toList();

        return horarioAtendimentoRepository.saveAll(horarios)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void validarRequest(HorarioAtendimentoRequest request) {
        boolean ativo = request.ativo() == null || request.ativo();

        if (!ativo) {
            return;
        }

        boolean atendimento24h = Boolean.TRUE.equals(request.atendimento24h());

        if (atendimento24h) {
            return;
        }

        if (request.horaInicio() == null) {
            throw new RuntimeException("A hora de início é obrigatória para dias ativos.");
        }

        if (request.horaFim() == null) {
            throw new RuntimeException("A hora de fim é obrigatória para dias ativos.");
        }

        if (!request.horaInicio().isBefore(request.horaFim())) {
            throw new RuntimeException("A hora inicial deve ser menor que a hora final.");
        }
    }

    private LocalTime obterHoraInicio(
            HorarioAtendimentoRequest request,
            boolean ativo,
            boolean atendimento24h
    ) {
        if (!ativo) {
            return null;
        }

        if (atendimento24h) {
            return LocalTime.MIN;
        }

        return request.horaInicio();
    }

    private LocalTime obterHoraFim(
            HorarioAtendimentoRequest request,
            boolean ativo,
            boolean atendimento24h
    ) {
        if (!ativo) {
            return null;
        }

        if (atendimento24h) {
            return LocalTime.of(23, 59);
        }

        return request.horaFim();
    }

    private void validarManicure() {
        if (usuarioAutenticadoService.isCliente()) {
            throw new RuntimeException("Cliente não pode configurar horários de atendimento.");
        }
    }

    private HorarioAtendimentoResponse toResponse(HorarioAtendimento horario) {
        return new HorarioAtendimentoResponse(
                horario.getId(),
                horario.getDiaSemana(),
                horario.getHoraInicio(),
                horario.getHoraFim(),
                horario.getAtivo(),
                horario.getAtendimento24h()
        );
    }
}