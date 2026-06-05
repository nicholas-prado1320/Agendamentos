package com.nicholas.backend.domain.repository;

import com.nicholas.backend.domain.entity.Agendamento;
import com.nicholas.backend.domain.entity.StatusAgendamento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    boolean existsByClienteId(Long clienteId);

    boolean existsByClienteIdAndStatusIn(
            Long clienteId,
            List<StatusAgendamento> statuses
    );

    List<Agendamento> findByStatusInOrderByDataAscHoraAsc(List<StatusAgendamento> statuses);

    List<Agendamento> findByClienteIdAndStatusInOrderByDataAscHoraAsc(
            Long clienteId,
            List<StatusAgendamento> statuses
    );

    List<Agendamento> findByDataAndStatusInOrderByHoraAsc(
            LocalDate data,
            List<StatusAgendamento> statuses
    );

    List<Agendamento> findByClienteIdAndDataAndStatusInOrderByHoraAsc(
            Long clienteId,
            LocalDate data,
            List<StatusAgendamento> statuses
    );

    List<Agendamento> findByDataBetweenAndStatusInOrderByDataAscHoraAsc(
            LocalDate dataInicio,
            LocalDate dataFim,
            List<StatusAgendamento> statuses
    );

    List<Agendamento> findByClienteIdAndDataBetweenAndStatusInOrderByDataAscHoraAsc(
            Long clienteId,
            LocalDate dataInicio,
            LocalDate dataFim,
            List<StatusAgendamento> statuses
    );
}