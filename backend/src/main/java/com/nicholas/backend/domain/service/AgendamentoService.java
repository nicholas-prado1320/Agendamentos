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
import java.util.List;

@Service
@RequiredArgsConstructor
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final ClienteService clienteService;
    private final ServicoService servicoService;

    public List<AgendamentoResponse> listar() {
        return agendamentoRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AgendamentoResponse> listarHoje() {
        return agendamentoRepository.findByDataOrderByHoraAsc(LocalDate.now())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<AgendamentoResponse> listarSemana() {
        LocalDate hoje = LocalDate.now();

        LocalDate inicioSemana = hoje.with(DayOfWeek.MONDAY);
        LocalDate fimSemana = hoje.with(DayOfWeek.SUNDAY);

        return agendamentoRepository.findByDataBetweenOrderByDataAscHoraAsc(inicioSemana, fimSemana)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public AgendamentoResponse criar(AgendamentoRequest request) {
        boolean horarioOcupado = agendamentoRepository.existsByDataAndHoraAndStatus(
                request.data(),
                request.hora(),
                StatusAgendamento.AGENDADO
        );

        if (horarioOcupado) {
            throw new RuntimeException("Já existe um agendamento ativo para esta data e horário.");
        }

        Cliente cliente = clienteService.buscarEntidadePorId(request.clienteId());
        Servico servico = servicoService.buscarEntidadePorId(request.servicoId());

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
        Agendamento agendamento = buscarEntidadePorId(id);

        agendamento.setStatus(StatusAgendamento.CONCLUIDO);

        return toResponse(agendamentoRepository.save(agendamento));
    }

    public AgendamentoResponse cancelar(Long id) {
        Agendamento agendamento = buscarEntidadePorId(id);

        agendamento.setStatus(StatusAgendamento.CANCELADO);

        return toResponse(agendamentoRepository.save(agendamento));
    }

    public void remover(Long id) {
        Agendamento agendamento = buscarEntidadePorId(id);

        agendamentoRepository.delete(agendamento);
    }

    private Agendamento buscarEntidadePorId(Long id) {
        return agendamentoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Agendamento não encontrado."));
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