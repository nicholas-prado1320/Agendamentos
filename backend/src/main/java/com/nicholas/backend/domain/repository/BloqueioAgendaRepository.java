package com.nicholas.backend.domain.repository;

import com.nicholas.backend.domain.entity.BloqueioAgenda;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface BloqueioAgendaRepository extends JpaRepository<BloqueioAgenda, Long> {

    List<BloqueioAgenda> findByAtivoTrueOrderByDataInicioAscHoraInicioAsc();

    List<BloqueioAgenda> findByAtivoTrueAndDataInicioLessThanEqualAndDataFimGreaterThanEqual(
            LocalDate dataInicio,
            LocalDate dataFim
    );
}