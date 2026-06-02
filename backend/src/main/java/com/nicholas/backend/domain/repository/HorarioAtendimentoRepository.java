package com.nicholas.backend.domain.repository;

import com.nicholas.backend.domain.entity.HorarioAtendimento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

public interface HorarioAtendimentoRepository extends JpaRepository<HorarioAtendimento, Long> {

    Optional<HorarioAtendimento> findByDiaSemanaAndAtivoTrue(DayOfWeek diaSemana);

    boolean existsByAtivoTrue();

    List<HorarioAtendimento> findByOrderByDiaSemanaAsc();
}