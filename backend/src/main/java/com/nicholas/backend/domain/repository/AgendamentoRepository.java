package com.nicholas.backend.domain.repository;

import com.nicholas.backend.domain.entity.Agendamento;
import com.nicholas.backend.domain.entity.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    List<Agendamento> findByDataOrderByHoraAsc(LocalDate data);

    List<Agendamento> findByDataBetweenOrderByDataAscHoraAsc(
            LocalDate dataInicio,
            LocalDate dataFim
    );

    boolean existsByDataAndHoraAndStatus(
            LocalDate data,
            LocalTime hora,
            StatusAgendamento status
    );

    List<Agendamento> findByDataAndStatus(
            LocalDate data,
            StatusAgendamento status
    );

    List<Agendamento> findByClienteIdOrderByDataAscHoraAsc(Long clienteId);

    List<Agendamento> findByClienteIdAndDataOrderByHoraAsc(
            Long clienteId,
            LocalDate data
    );

    List<Agendamento> findByClienteIdAndDataBetweenOrderByDataAscHoraAsc(
            Long clienteId,
            LocalDate dataInicio,
            LocalDate dataFim
    );
}